# Rendering the narration audio

Spec §8.3 (`docs/superpowers/specs/2026-09-05-werewolf-pwa-design.md`) says the narrator's
whole script is pre-rendered to mp3 and the client only ever looks a key up — no runtime TTS
call, because the old app's runtime Google-Translate-TTS route depended on the network at the
worst possible moment and once mispronounced a role name.

Everything for that is in place except the recordings themselves. This is the runbook.

## What has to exist

37 files under `public/audio/narration/`:

- one per key in `NARRATION_SENTENCES` (`src/lib/game/narration.ts`) → `{KEY}.mp3`
- one per entry in `NARRATION_COUNT_WORDS`, i.e. 0–16 → `count-{n}.mp3`

`scripts/render-narration.mjs --list` prints the exact path and the exact Vietnamese line for
each one. That catalog is read straight out of `narration.ts`, so the list can never disagree
with what the app plays.

## Rendering them

Pick one provider, export its credentials, run the script once. It is idempotent: it renders
only what is missing or whose line in `narration.ts` has changed since.

```sh
# Google Cloud Text-to-Speech (default voice vi-VN-Wavenet-A)
GOOGLE_TTS_API_KEY=... npm run narration:render -- --provider google

# or Azure AI Speech (default voice vi-VN-HoaiMyNeural)
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=southeastasia \
  npm run narration:render -- --provider azure
```

Useful flags: `--voice vi-VN-Neural2-D`, `--rate 0.95` (slower reads better for a room full of
players), `--only WOLVES,count-3` to redo a few clips, `--force` to redo everything.

## Why there is no offline mode

Deliberate. Vietnamese is tonal: a wrong tone from `espeak`/`flite`/`pico2wave` is not a
"robotic" version of the word, it is a different word. §8.3 already rejected a *better* engine
than those on quality grounds, so the script has no local/placeholder path at all and refuses
to run without a real neural voice. Committing placeholder audio would also be worse than
committing nothing: `useNarrationPlayback` fails silently on a missing file, so with no clips
the game simply runs without a narrator, which is a fine intermediate state.

## Verifying

```sh
npm run narration:check   # per-clip: rendered / missing / stale, exit 1 if incomplete
npm test                  # src/test/narrationCatalog.test.ts enforces the same, all-or-nothing
```

The test treats a *partial* render as a failure — 37 or 0, nothing between — and compares each
rendered clip against `manifest.json`, which records the text every clip was actually spoken
from. Rewording a line in `narration.ts` therefore turns that clip stale instead of leaving the
old recording playing forever.

After rendering, bump `CACHE_VERSION` in `public/sw.js` so already-installed clients pick the
new clips up; the service worker caches this directory as immutable on purpose.
