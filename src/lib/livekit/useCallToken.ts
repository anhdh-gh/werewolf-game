"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export interface CallToken {
  token: string;
  url: string;
  room: string;
  canPublish: boolean;
}

/** Same backoff shape as useAutoAdvance (see useGameClock). A phase lasts
 * minutes; a call room that failed its one and only token fetch in the first
 * second of it must not stay dead for the rest. */
export const CALL_TOKEN_RETRY_BASE_MS = 1_000;
export const CALL_TOKEN_RETRY_MAX_MS = 15_000;

/** Appended to the message shown while another attempt is still coming, so
 * the error card reads as "not yet" rather than "give up". */
export const CALL_TOKEN_RETRYING_SUFFIX = " — đang thử lại…";

/**
 * Which non-ok statuses are worth asking again for. /api/livekit/token
 * answers 500 for a server-side fault it could not classify — a missing
 * LiveKit config, or an Admin SDK that could not run at all (see that
 * route's isTokenRejection: the whole point of the 401/500 split is that a
 * 500 means "the server broke", which is transient far more often than not).
 * 400/403/404 are verdicts about this player in this phase; retrying them
 * just burns the endpoint. 401 gets its own one-shot handling below.
 */
export function isRetryableTokenStatus(status: number): boolean {
  return status >= 500;
}

/**
 * Fetches a LiveKit token for the current phase's call room (spec §10),
 * whenever `enabled` is true. Re-fetches on every `gameId`/`enabled`
 * change — enabled flips false the moment the phase moves on (see
 * CallRoom's caller in GameScreen), so a stale token for a room that no
 * longer applies never lingers into the next phase.
 *
 * Failures retry rather than sticking: this effect only re-runs when the
 * phase moves on, so a single 500 or dropped request used to leave the
 * player staring at an error card until the next phase, which is the same
 * "one failure freezes it for good" shape the ERR_REQUIRE_ESM outage hit on
 * the advance route. Every failure is also console.error'd — a call room
 * that never connects otherwise leaves no trace anywhere.
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
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    // getIdToken() hands back a cached JWT; a phone that slept through its
    // refresh window presents an expired one and gets a perfectly correct
    // 401. Spend exactly one forced refresh on that before believing the
    // server and telling the player their login is bad.
    let forceRefresh = false;
    let refreshSpent = false;

    // 0–400ms of spread on every attempt, so a room full of clients retrying
    // a failing endpoint stays staggered.
    const jitter = () => Math.random() * 400;

    const retryIn = (delayMs: number) => {
      timer = setTimeout(() => void attempt(), delayMs + jitter());
    };

    const backoffRetry = () => {
      failures += 1;
      retryIn(
        Math.min(CALL_TOKEN_RETRY_BASE_MS * 2 ** (failures - 1), CALL_TOKEN_RETRY_MAX_MS),
      );
    };

    const attempt = async (): Promise<void> => {
      try {
        const idToken = await user.getIdToken(forceRefresh);
        forceRefresh = false;
        const res = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ gameId }),
        });

        if (res.ok) {
          const body = (await res.json()) as CallToken;
          if (cancelled) return;
          setCallToken(body);
          setError(null);
          return;
        }

        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (cancelled) return;
        const message = body?.error ?? "Không lấy được phòng gọi";
        console.error(`[callToken] /api/livekit/token trả về ${res.status}: ${message}`);
        setCallToken(null);

        if (res.status === 401 && !refreshSpent) {
          refreshSpent = true;
          forceRefresh = true;
          setError(message + CALL_TOKEN_RETRYING_SUFFIX);
          retryIn(0);
          return;
        }

        if (isRetryableTokenStatus(res.status)) {
          setError(message + CALL_TOKEN_RETRYING_SUFFIX);
          backoffRetry();
          return;
        }

        setError(message);
      } catch (err) {
        // fetch rejects for a dropped connection, and getIdToken() rejects
        // when Firebase itself cannot be reached — both are transient.
        console.error("[callToken] không gọi được /api/livekit/token", err);
        if (cancelled) return;
        setCallToken(null);
        setError("Không kết nối được phòng gọi" + CALL_TOKEN_RETRYING_SUFFIX);
        backoffRetry();
      }
    };

    void attempt();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user, gameId, enabled]);

  return { callToken, error };
}
