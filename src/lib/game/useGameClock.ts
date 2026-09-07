"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";

/** Spec §6.4: the phase clock is an absolute server timestamp. Every client
 * corrects its local clock against RTDB's own drift estimate rather than
 * trusting its own clock outright. */
export function useServerTimeOffset(db: Database): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, ".info/serverTimeOffset"), (snapshot) => {
      setOffset(typeof snapshot.val() === "number" ? snapshot.val() : 0);
    });
    return unsubscribe;
  }, [db]);

  return offset;
}

/** Seconds remaining until `endsAt` (a server timestamp), ticking locally. */
export function useCountdownSeconds(endsAt: number, serverOffset: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const serverNow = now + serverOffset;
  return Math.max(0, Math.ceil((endsAt - serverNow) / 1000));
}

/** Spec §6.3: "mọi máy đều gọi" advance() once its own clock crosses
 * endsAt, with a small random delay so every client in the room doesn't
 * hit the endpoint in the same instant. Re-arms whenever the phase itself
 * changes (name+version+endsAt identify a specific phase instance). */
export function useAutoAdvance(
  gameId: string,
  phase: { name: string; version: number; endsAt: number } | undefined,
  serverOffset: number,
): void {
  useEffect(() => {
    if (!phase || phase.name === "ENDED") return;

    const msUntilEnd = phase.endsAt - (Date.now() + serverOffset);
    const jitter = Math.random() * 400;
    const timer = setTimeout(
      () => {
        fetch(`/api/games/${gameId}/advance`, { method: "POST" }).catch(() => {
          // best-effort — another client's call, or the next tick, covers it
        });
      },
      Math.max(0, msUntilEnd) + jitter,
    );

    return () => clearTimeout(timer);
  }, [gameId, phase?.name, phase?.version, phase?.endsAt, serverOffset]);
}
