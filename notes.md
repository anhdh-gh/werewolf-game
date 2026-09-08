# Werewolf PWA — live-readiness notes

Running log for the "make it actually run live" work. Each entry says what was
changed, what was *verified* (CI run / live API call — never a local run; this
machine runs nothing, see `~/work/anhdh/CLAUDE.md` §2), and where to resume.

## Remaining scope

From `docs/superpowers/plans/2026-09-07-resilience.md` § "What's left before any
of this runs live". The game engine and Resilience Tasks 1–7 are done; none of
the below is more game logic.

1. **Narration audio pipeline** — `src/lib/game/narration.ts` names 37 files that
   do not exist (20 sentence clips + 17 count words). Needs a repeatable render
   script and a test asserting catalog ⇄ file parity. Explicitly *not* placeholder
   espeak audio: spec §8.3 rejected robotic TTS on purpose.
2. **Live-verification tooling** — a preflight script reporting exactly which of
   the owner-only secrets and rule deployments are missing, so the whole thing can
   be verified in one command the moment they exist.
3. **Multi-client integration coverage** — several simultaneous clients driven
   through a full game against the emulator, with chat and phase gating on.

## Iteration log

### 2026-09-08 — CI existed nowhere. Now it does.

`.github/workflows` did not exist on `main`. The 158 Actions runs the GitHub API
reports all belong to the *old* app on the `backend` branch (`main.yml`, deleted
in `ab8f098`); the PWA rewrite has never had a single automated check. Since the
objective's hard constraint is "CI must be green before a story counts as done"
and this machine deliberately runs nothing locally, there was no way to verify
anything at all. That had to come first.

Added `ci.yml` with three independent jobs, so one push reports all three
verdicts instead of stopping at the first failure:

- **typecheck** — `tsc --noEmit` (new `npm run typecheck`). Never run before.
- **test** — new `npm run test:ci`, which wraps `vitest run` in
  `firebase emulators:exec`. `src/test/rules.test.ts` and `rulesGames.test.ts`
  need the RTDB emulator on 127.0.0.1:9000; plain `npm test` assumes you started
  it yourself. `setup-java` is explicit because the emulator is a Java process.
- **build** — `next build` with placeholder `NEXT_PUBLIC_FIREBASE_*` values.
  `src/lib/firebase/client.ts` calls `getFirebaseConfig()` at module scope and
  throws on a missing key, so prerender needs them to *exist*; they are fake by
  design and no real credential belongs in a workflow file.

**Verified:** pending — see the CI run for this commit. This entry gets updated
with the real result before anything else is claimed done.

**Resume at:** read the first CI run's outcome, fix whatever it exposes (a
never-typechecked codebase is unlikely to be clean on the first try), and only
then start scope item 1.
