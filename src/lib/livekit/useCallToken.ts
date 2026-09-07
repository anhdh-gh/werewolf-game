"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export interface CallToken {
  token: string;
  url: string;
  room: string;
  canPublish: boolean;
}

/**
 * Fetches a LiveKit token for the current phase's call room (spec §10),
 * whenever `enabled` is true. Re-fetches on every `gameId`/`enabled`
 * change — enabled flips false the moment the phase moves on (see
 * CallRoom's caller in GameScreen), so a stale token for a room that no
 * longer applies never lingers into the next phase.
 */
export function useCallToken(user: User | null, gameId: string, enabled: boolean): {
  callToken: CallToken | null;
  error: string | null;
} {
  const [callToken, setCallToken] = useState<CallToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !user) {
      setCallToken(null);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ gameId }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          if (!cancelled) {
            setCallToken(null);
            setError(body?.error ?? "Không lấy được phòng gọi");
          }
          return;
        }
        const body = (await res.json()) as CallToken;
        if (!cancelled) {
          setCallToken(body);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Không kết nối được phòng gọi");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, gameId, enabled]);

  return { callToken, error };
}
