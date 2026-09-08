/**
 * The single source of truth for "which narration clips must exist" is
 * `src/lib/game/narration.ts` — the same module the browser imports to
 * decide which file to play. This module reads that catalog so the render
 * script and the coverage test can never drift from the player.
 *
 * Why parse the TypeScript instead of importing it: this script has to run
 * as plain `node scripts/render-narration.mjs` with no build step and no
 * dev dependency installed, and Node's type stripping is still version
 * dependent. The parse is deliberately strict — any line inside either
 * catalog block that isn't a plain `KEY: "text",` / `"word",` entry throws
 * rather than being skipped, so reformatting narration.ts fails loudly
 * instead of silently dropping a clip. `src/test/narrationCatalog.test.ts`
 * additionally asserts this parse equals what the real TS module exports.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Where the rendered clips live, mirroring narration.ts's path helpers. */
export const NARRATION_DIR = path.join(REPO_ROOT, "public", "audio", "narration");
export const NARRATION_URL_PREFIX = "/audio/narration";

/** Written next to the clips by the render script: what was rendered, with
 * which voice, from which exact text. Lets `--check` spot a clip whose
 * script line has since been reworded, which a bare file-exists check
 * cannot. */
export const MANIFEST_FILE = path.join(NARRATION_DIR, "manifest.json");

const SOURCE_FILE = path.join(REPO_ROOT, "src", "lib", "game", "narration.ts");

const STRING_RE = String.raw`"(?:[^"\\]|\\.)*"`;

function blockBody(source, startMarker, closer) {
  const start = source.indexOf(startMarker);
  if (start === -1) throw new Error(`narration.ts no longer contains: ${startMarker}`);
  const bodyStart = start + startMarker.length;
  const end = source.indexOf(closer, bodyStart);
  if (end === -1) throw new Error(`unterminated block after: ${startMarker}`);
  return source.slice(bodyStart, end);
}

function parseSentences(source) {
  const body = blockBody(
    source,
    "export const NARRATION_SENTENCES: Record<NarrationSentenceKey, string> = {",
    "\n};",
  );
  const entryRe = new RegExp(String.raw`^\s*([A-Z][A-Z0-9_]*):\s*(${STRING_RE}),\s*$`);
  const sentences = [];
  for (const line of body.split("\n")) {
    if (line.trim() === "") continue;
    const match = entryRe.exec(line);
    if (!match) throw new Error(`unparseable NARRATION_SENTENCES line: ${line}`);
    sentences.push({ key: match[1], text: JSON.parse(match[2]) });
  }
  return sentences;
}

function parseCountWords(source) {
  const body = blockBody(
    source,
    "export const NARRATION_COUNT_WORDS: readonly string[] = [",
    "\n];",
  );
  const entryRe = new RegExp(String.raw`^\s*(${STRING_RE}),\s*$`);
  const words = [];
  for (const line of body.split("\n")) {
    if (line.trim() === "") continue;
    const match = entryRe.exec(line);
    if (!match) throw new Error(`unparseable NARRATION_COUNT_WORDS line: ${line}`);
    words.push(JSON.parse(match[1]));
  }
  return words;
}

/**
 * Every clip the app can ask for, as a flat list. `id` is the filename stem
 * (also the manifest key), `text` is the exact Vietnamese to speak, and
 * `urlPath` is what `narrationSentencePath`/`narrationCountPath` return.
 */
export function loadNarrationCatalog(sourceFile = SOURCE_FILE) {
  const source = readFileSync(sourceFile, "utf8");

  const clips = parseSentences(source).map(({ key, text }) => ({
    id: key,
    kind: "sentence",
    text,
  }));

  parseCountWords(source).forEach((word, count) => {
    clips.push({ id: `count-${count}`, kind: "count", text: word });
  });

  return clips.map((clip) => ({
    ...clip,
    file: path.join(NARRATION_DIR, `${clip.id}.mp3`),
    urlPath: `${NARRATION_URL_PREFIX}/${clip.id}.mp3`,
  }));
}
