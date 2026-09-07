"use client";

import { useEffect, useRef } from "react";
import { type Database, ref, query, limitToLast, onValue } from "firebase/database";
import { gameNarrationPath } from "./paths";
import { NARRATION_COUNT_WORDS, narrationSentencePath, narrationCountPath } from "./narration";
import type { NarrationEvent } from "./narration";

function playClip(src: string): Promise<void> {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.addEventListener("ended", () => resolve());
    audio.addEventListener("error", () => resolve());
    audio.play().catch(() => resolve());
  });
}

async function playEvent(event: NarrationEvent): Promise<void> {
  await playClip(narrationSentencePath(event.key));
  // DAWN_DEATHS_PREFIX is the one key that splices a count word in before
  // its suffix plays — see narration.ts's file-count rationale.
  if (event.key === "DAWN_DEATHS_PREFIX" && typeof event.count === "number") {
    const word = NARRATION_COUNT_WORDS[event.count];
    if (word !== undefined) {
      await playClip(narrationCountPath(event.count));
    }
    await playClip(narrationSentencePath("DAWN_DEATHS_SUFFIX"));
  }
}

/** Subscribes to games/{gameId}/narration and plays whatever the server
 * just announced (spec §8.3). Skips the very first snapshot delivered
 * after subscribing — that's whatever was already the latest announcement
 * (e.g. a client joining mid-game), not a new one — only announcements
 * that arrive AFTER this mount trigger playback. Missing audio files
 * (nothing has been TTS-rendered into /public/audio/narration/ yet — see
 * narration.ts) fail silently via playClip's own error handling, same as
 * every other best-effort browser feature in this codebase. */
export function useNarrationPlayback(db: Database, gameId: string, enabled: boolean): void {
  const lastSeqRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    initializedRef.current = false;
    lastSeqRef.current = null;

    const narrationQuery = query(ref(db, gameNarrationPath(gameId)), limitToLast(1));
    const unsubscribe = onValue(narrationQuery, (snapshot) => {
      const val = snapshot.val() as Record<string, NarrationEvent> | null;
      if (!val) return;
      const entries = Object.entries(val);
      const [seq, event] = entries[0];

      if (!initializedRef.current) {
        initializedRef.current = true;
        lastSeqRef.current = seq;
        return;
      }
      if (seq === lastSeqRef.current) return;
      lastSeqRef.current = seq;

      playEvent(event);
    });

    return unsubscribe;
  }, [db, gameId, enabled]);
}
