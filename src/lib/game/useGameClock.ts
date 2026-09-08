"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import { requestAdvance } from "./actions";

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

/** Spec §6.3 promises "một người rớt mạng không làm treo bàn": one call
 * getting through is enough. The converse is what bites — a phase only
 * re-arms this effect by *changing*, and it only changes when a call
 * succeeds, so a single swallowed failure at endsAt freezes the table for
 * good. A 500 from the server hits every client at once, which is exactly
 * the shape of the ERR_REQUIRE_ESM outage: the game would have hung at the
 * first phase boundary with nothing on screen and nothing in the console.
 * So keep asking, backing off, until the phase moves or the player leaves. */
export const ADVANCE_RETRY_BASE_MS = 1_000;
export const ADVANCE_RETRY_MAX_MS = 15_000;

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

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;

    // 0–400ms of spread on every attempt, not just the first, so a room full
    // of clients retrying a failing endpoint stays staggered.
    const jitter = () => Math.random() * 400;

    const attempt = () => {
      void requestAdvance(gameId).then((ok) => {
        if (cancelled || ok) return;
        failures += 1;
        const backoff = Math.min(
          ADVANCE_RETRY_BASE_MS * 2 ** (failures - 1),
          ADVANCE_RETRY_MAX_MS,
        );
        timer = setTimeout(attempt, backoff + jitter());
      });
    };

    const msUntilEnd = phase.endsAt - (Date.now() + serverOffset);
    timer = setTimeout(attempt, Math.max(0, msUntilEnd) + jitter());

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [gameId, phase?.name, phase?.version, phase?.endsAt, serverOffset]);
}
