#!/usr/bin/env node
/**
 * Renders the narration script (spec §8.3) to the exact mp3 files
 * `src/lib/game/narration.ts` asks the browser to play.
 *
 *   scripts/render-narration.mjs --list                 # what would be rendered
 *   scripts/render-narration.mjs --check                # what's missing/stale (exit 1 if any)
 *   scripts/render-narration.mjs --provider google      # actually render
 *   scripts/render-narration.mjs --provider google --force --only WOLVES,count-3
 *
 * Output: public/audio/narration/{KEY}.mp3 for each NARRATION_SENTENCES key
 * and count-{0..16}.mp3 for each NARRATION_COUNT_WORDS entry — 37 files,
 * plus a manifest.json recording the voice and the exact text each clip was
 * rendered from.
 *
 * WHY A SCRIPT AND NOT COMMITTED AUDIO: spec §8.3 rejected the old app's
 * runtime Google-Translate-TTS route on quality and reliability grounds
 * (it once mispronounced a role name badly enough to need its own bugfix
 * branch). Offline engines available to a dev sandbox — espeak, flite,
 * pico2wave — are markedly worse than that, and Vietnamese is tonal, so a
 * wrong-tone clip isn't "robotic", it's a different word. This script
 * therefore has no offline/placeholder mode at all, by design: it only
 * speaks through a real neural Vietnamese voice, and it is safe to re-run —
 * it re-renders only what is missing or whose script line has changed.
 *
 * WHAT THE OWNER NEEDS TO RUN IT: one provider credential, nothing else.
 *
 *   Google Cloud Text-to-Speech (default voice vi-VN-Wavenet-A):
 *     GOOGLE_TTS_API_KEY=... scripts/render-narration.mjs --provider google
 *     Enable "Cloud Text-to-Speech API" and create a browser/HTTP API key.
 *     Other Vietnamese voices: vi-VN-Wavenet-{A,B,C,D}, vi-VN-Neural2-{A,D},
 *     vi-VN-Chirp3-HD-* — pass with --voice.
 *
 *   Azure AI Speech (default voice vi-VN-HoaiMyNeural):
 *     AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southeastasia \
 *       scripts/render-narration.mjs --provider azure
 *     Other Vietnamese voices: vi-VN-HoaiMyNeural, vi-VN-NamMinhNeural.
 *
 * Adding a third provider is ~15 lines: one entry in PROVIDERS returning an
 * mp3 Buffer for a string. Keep it mp3 — there is no ffmpeg step here, the
 * clips are written exactly as the API returns them.
 *
 * AFTER RENDERING: `npm test` (src/test/narrationCatalog.test.ts) enforces
 * that all 37 exist and match the catalog; bump CACHE_VERSION in
 * public/sw.js so already-installed clients pick the clips up.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { MANIFEST_FILE, NARRATION_DIR, loadNarrationCatalog } from "./narration-catalog.mjs";

const PROVIDERS = {
  google: {
    defaultVoice: "vi-VN-Wavenet-A",
    requiredEnv: ["GOOGLE_TTS_API_KEY"],
    async synthesize(text, { voice, rate }) {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(
          process.env.GOOGLE_TTS_API_KEY,
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: "vi-VN", name: voice },
            audioConfig: { audioEncoding: "MP3", speakingRate: rate },
          }),
        },
      );
      if (!response.ok) throw new Error(`Google TTS ${response.status}: ${await response.text()}`);
      const { audioContent } = await response.json();
      if (!audioContent) throw new Error("Google TTS returned no audioContent");
      return Buffer.from(audioContent, "base64");
    },
  },

  azure: {
    defaultVoice: "vi-VN-HoaiMyNeural",
    requiredEnv: ["AZURE_SPEECH_KEY", "AZURE_SPEECH_REGION"],
    async synthesize(text, { voice, rate }) {
      // Azure takes speed as a percentage delta, not a multiplier.
      const ratePercent = `${Math.round((rate - 1) * 100)}%`;
      const ssml =
        `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="vi-VN">` +
        `<voice name="${voice}"><prosody rate="${ratePercent}">${escapeXml(text)}</prosody></voice>` +
        `</speak>`;
      const response = await fetch(
        `https://${process.env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
        {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": process.env.AZURE_SPEECH_KEY,
            "Content-Type": "application/ssml+xml",
            "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
            "User-Agent": "werewolf-game-narration-render",
          },
          body: ssml,
        },
      );
      if (!response.ok) throw new Error(`Azure TTS ${response.status}: ${await response.text()}`);
      return Buffer.from(await response.arrayBuffer());
    },
  },
};

function escapeXml(text) {
  return text.replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
}

export const textHash = (text) => createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);

function readManifest() {
  if (!existsSync(MANIFEST_FILE)) return { clips: {} };
  try {
    const parsed = JSON.parse(readFileSync(MANIFEST_FILE, "utf8"));
    return { clips: {}, ...parsed };
  } catch {
    return { clips: {} };
  }
}

/**
 * Per-clip render state. "stale" means the file is there but narration.ts's
 * wording changed since — the whole point of tracking the text hash, since
 * a reworded line otherwise keeps playing the old recording forever.
 */
export function clipStatus(clip, manifest) {
  if (!existsSync(clip.file) || statSync(clip.file).size === 0) return "missing";
  const recorded = manifest.clips?.[clip.id];
  if (recorded && recorded.textHash !== textHash(clip.text)) return "stale";
  return "ok";
}

function parseArgs(argv) {
  const args = { rate: 1.0, only: null, force: false, mode: "render" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const value = () => {
      const next = argv[i + 1];
      if (next === undefined) throw new Error(`${arg} needs a value`);
      i += 1;
      return next;
    };
    if (arg === "--list") args.mode = "list";
    else if (arg === "--check") args.mode = "check";
    else if (arg === "--force") args.force = true;
    else if (arg === "--provider") args.provider = value();
    else if (arg === "--voice") args.voice = value();
    else if (arg === "--rate") args.rate = Number(value());
    else if (arg === "--only") args.only = value().split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--help" || arg === "-h") args.mode = "help";
    else throw new Error(`unknown argument: ${arg}`);
  }
  return args;
}

function printHelp() {
  console.log(readFileSync(new URL(import.meta.url), "utf8").split("\n").slice(1, 46).join("\n"));
}

async function main(argv) {
  const args = parseArgs(argv);
  const catalog = loadNarrationCatalog();
  const manifest = readManifest();

  if (args.mode === "help") {
    printHelp();
    return 0;
  }

  if (args.mode === "list") {
    for (const clip of catalog) console.log(`${clip.urlPath}\t${clip.text}`);
    console.log(`\n${catalog.length} clips.`);
    return 0;
  }

  if (args.mode === "check") {
    const byStatus = { ok: [], missing: [], stale: [] };
    for (const clip of catalog) byStatus[clipStatus(clip, manifest)].push(clip.id);
    console.log(
      `narration audio: ${byStatus.ok.length}/${catalog.length} rendered` +
        (manifest.voice ? ` (voice ${manifest.voice}, provider ${manifest.provider})` : ""),
    );
    if (byStatus.missing.length) console.log(`missing (${byStatus.missing.length}): ${byStatus.missing.join(", ")}`);
    if (byStatus.stale.length) console.log(`stale (${byStatus.stale.length}): ${byStatus.stale.join(", ")}`);
    return byStatus.missing.length || byStatus.stale.length ? 1 : 0;
  }

  const provider = PROVIDERS[args.provider];
  if (!provider) {
    console.error(
      `--provider is required and must be one of: ${Object.keys(PROVIDERS).join(", ")}.\n` +
        "There is deliberately no offline/placeholder voice — see this file's header.",
    );
    return 2;
  }
  const missingEnv = provider.requiredEnv.filter((name) => !process.env[name]);
  if (missingEnv.length) {
    console.error(`provider "${args.provider}" needs: ${missingEnv.join(", ")}`);
    return 2;
  }

  const voice = args.voice ?? provider.defaultVoice;
  const wanted = args.only ? catalog.filter((c) => args.only.includes(c.id)) : catalog;
  if (args.only) {
    const unknown = args.only.filter((id) => !catalog.some((c) => c.id === id));
    if (unknown.length) {
      console.error(`--only names clips that aren't in the catalog: ${unknown.join(", ")}`);
      return 2;
    }
  }

  mkdirSync(NARRATION_DIR, { recursive: true });
  let rendered = 0;
  let skipped = 0;
  for (const clip of wanted) {
    if (!args.force && clipStatus(clip, manifest) === "ok") {
      skipped += 1;
      continue;
    }
    const audio = await provider.synthesize(clip.text, { voice, rate: args.rate });
    writeFileSync(clip.file, audio);
    manifest.clips[clip.id] = { text: clip.text, textHash: textHash(clip.text), bytes: audio.length };
    rendered += 1;
    console.log(`rendered ${clip.urlPath} (${audio.length} bytes)`);
  }

  manifest.provider = args.provider;
  manifest.voice = voice;
  manifest.rate = args.rate;
  manifest.renderedAt = new Date().toISOString();
  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\n${rendered} rendered, ${skipped} already up to date. Voice: ${voice}.`);
  console.log("Next: bump CACHE_VERSION in public/sw.js, then npm test.");
  return 0;
}

// Only run when invoked directly — the test imports clipStatus/textHash.
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error(error.message ?? error);
      process.exit(1);
    },
  );
}
