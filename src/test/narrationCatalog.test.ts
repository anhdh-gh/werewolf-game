// @vitest-environment node
//
// Spec §8.3 says the narration is pre-rendered mp3s and the client just
// looks a key up. That only holds if the files on disk and the catalog in
// narration.ts stay in lockstep — and nothing else in the codebase can
// notice when they don't: useNarrationPlayback swallows a missing file
// silently on purpose (best-effort audio beats a crashed phase screen), so
// a mistyped key or an un-rendered clip would show up as "the narrator went
// quiet during a real game" and nowhere earlier. This file is that earlier
// place.
//
// It checks three things:
//   1. scripts/narration-catalog.mjs parses narration.ts into exactly what
//      the TS module exports (the render script has no build step, so it
//      reads the catalog as text — this pins that parse to the real thing).
//   2. The paths it derives are byte-identical to what the player asks for
//      via narrationSentencePath/narrationCountPath.
//   3. Coverage of the actual files, all-or-nothing: a partial render
//      fails. Until the owner runs scripts/render-narration.mjs with a real
//      Vietnamese neural voice, zero clips exist and that pending state is
//      asserted explicitly — so this test cannot quietly stay green after
//      audio lands but drifts.

import { existsSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  NARRATION_COUNT_WORDS,
  NARRATION_SENTENCES,
  narrationCountPath,
  narrationSentencePath,
  type NarrationSentenceKey,
} from "@/lib/game/narration";
import { MANIFEST_FILE, loadNarrationCatalog } from "../../scripts/narration-catalog.mjs";

const catalog = loadNarrationCatalog();
const sentences = catalog.filter((clip) => clip.kind === "sentence");
const counts = catalog.filter((clip) => clip.kind === "count");

describe("narration catalog parsing", () => {
  it("parses every sentence out of narration.ts with its exact text", () => {
    const parsed = Object.fromEntries(sentences.map((clip) => [clip.id, clip.text]));
    expect(parsed).toEqual(NARRATION_SENTENCES);
  });

  it("parses every count word in order", () => {
    expect(counts.map((clip) => clip.text)).toEqual([...NARRATION_COUNT_WORDS]);
  });

  it("covers 0 through the spec's 16-player maximum", () => {
    expect(counts.map((clip) => clip.id)).toEqual(
      Array.from({ length: 17 }, (_, n) => `count-${n}`),
    );
  });
});

describe("narration clip paths", () => {
  it("derives the same URL the player will request for each sentence", () => {
    for (const clip of sentences) {
      expect(clip.urlPath).toBe(narrationSentencePath(clip.id as NarrationSentenceKey));
    }
  });

  it("derives the same URL the player will request for each count word", () => {
    counts.forEach((clip, n) => {
      expect(clip.urlPath).toBe(narrationCountPath(n));
    });
  });

  it("maps every URL onto a file under public/", () => {
    for (const clip of catalog) {
      expect(clip.file.endsWith(`/public${clip.urlPath}`)).toBe(true);
    }
  });
});

describe("rendered narration audio", () => {
  const present = catalog.filter(
    (clip) => existsSync(clip.file) && statSync(clip.file).size > 0,
  );

  it("has either every clip rendered or none at all — never a partial set", () => {
    // The "none" branch is today's reality: rendering needs a real neural
    // Vietnamese voice (see scripts/render-narration.mjs), which no tool in
    // this repo's sandbox provides. Once the owner runs that script, this
    // flips to the "every" branch permanently and any later catalog addition
    // without a matching clip fails here.
    if (present.length === 0) {
      expect(existsSync(MANIFEST_FILE)).toBe(false);
      return;
    }
    const missing = catalog.filter((clip) => !present.includes(clip)).map((clip) => clip.id);
    expect(missing).toEqual([]);
  });

  it("records each rendered clip in the manifest with the text it was spoken from", () => {
    if (present.length === 0) return;
    const manifest = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"));
    expect(manifest.voice).toBeTruthy();
    for (const clip of catalog) {
      expect(manifest.clips?.[clip.id]?.text).toBe(clip.text);
    }
  });
});
