# Live preflight

```sh
npm run preflight
```

One command that answers "what is still missing before this can run a real
game". Every plan in `docs/superpowers/plans/` closes with the same list of
things that need the owner's own access rather than more code; this turns that
prose into a check run.

Exit code is 0 when nothing FAILed, 1 otherwise, so it is usable as a gate.

```
npm run preflight -- --json      # same checks, machine-readable
npm run preflight -- --offline   # only the checks that need no network
```

## It is read-only

It runs `vercel ls`, `vercel env ls production`, `firebase
database:instances:list`, `firebase database:rules:list` / `rules:get`, and
unauthenticated HTTPS GETs against the Realtime Database. It never deploys,
never writes to the database, never creates an auth user, and never prints an
environment variable's value — only whether the name is set.

Requires `vercel login` + `vercel link`, and `firebase login`. Both are
read-only credentials as far as this script is concerned.

## What it checks

| Check | What a FAIL means |
|---|---|
| Narration audio | Some of the 37 clips in `src/lib/game/narration.ts` are not rendered, so the narrator goes silent for those phases. See `docs/narration-audio.md`. |
| Env vars, per feature | A variable the shipped code reads is not set in Vercel **production**. Grouped by the feature that breaks, with the console path to create each one. |
| Local env | Informational (always SKIP, never FAIL): production reads Vercel's environment, not your machine's. It only matters for `npm run dev`. |
| Vercel production deployment | The newest production deployment finished in a state other than Ready. A deployment still Building is a SKIP, not a FAIL. |
| Build-time vars in the deployed bundle | A `NEXT_PUBLIC_*` variable is set in Vercel but was set **after** the newest Ready production deployment, so Next.js never inlined it and the served bundle does not contain it. The env-vars check above cannot see this — it reports PASS while the feature is dead in the browser. Fix: redeploy. Vercel reports both ages rounded to one unit, so when the variable and the deployment fall in the same bucket the check reports SKIP rather than guessing either way. |
| RTDB instance | The project has no default Realtime Database instance. On PASS it also prints the exact host `NEXT_PUBLIC_FIREBASE_DATABASE_URL` must point at — this project's instance lives in `asia-southeast1`, whose hostname is *not* the `*.firebaseio.com` one Firebase docs show by default. |
| RTDB unauthenticated read | `GET /games/*.json` with no credentials succeeded — the database is in test mode and every player's secret role is public. Deploy the rules immediately. |
| Deployed rules match `database.rules.json` | The released ruleset is not the one in this repo. That matters more than it looks: `src/test/rules.test.ts` and `rulesGames.test.ts` assert against the committed file, so CI is green about a ruleset that is not live. |

## The rules-match check needs one flag turned on

`firebase database:rules:list` / `rules:get` are the only read-only way to see
the released ruleset, and firebase-tools keeps them behind an experiment:

```sh
firebase experiments:enable rtdbrules
```

That is a local CLI setting — it changes nothing on the project. Until it is
on, the check reports SKIP with that command rather than guessing. Without it,
the unauthenticated-read check still proves the database is not world-readable;
it just cannot tell "our rules are deployed" apart from "Firebase's default
locked rules are deployed", because both deny an anonymous read.

## Keeping it honest

`src/test/preflight.test.ts` greps every `process.env.*` out of `src/` and fails
if the preflight's required-variable table and the code disagree in either
direction. A new environment variable therefore cannot be added to the app
without also being preflighted — which is the failure mode this whole script
exists to prevent.

The CLI output parsers are pinned to captured samples in the same file, because
each of them has a trap: `vercel ls` writes its table to **stderr** and bare
URLs to stdout, `vercel env ls` does the opposite, the status column carries a
`●` bullet, and the "Next steps" footer contains lines whose first token looks
exactly like a variable name.
