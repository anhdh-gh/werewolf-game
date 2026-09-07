# Game Engine Implementation Plan

**Goal:** Turn the Lobby (already live) into a full playable round of Ma Sói: role
assignment, the night/day phase machine, night-action resolution, day voting, win
detection, and role reveal at game end — matching
`docs/superpowers/specs/2026-09-05-werewolf-pwa-design.md` §4, §6, §7.

**Explicitly out of scope for this plan** (tracked as separate later sub-projects,
per the Foundation & Lobby plan's own Global Constraints):
- Background audio keep-alive, prebuilt TTS narration, Wake Lock, push notifications
  (spec §8) — **Resilience sub-project**.
- LiveKit voice/video call rooms (spec §10) — **Voice/Video sub-project**.

Without those, a round is playable by people sitting at one table who keep the app
open and read phase prompts on-screen — exactly how a physical card-based game plays
except the timer, night resolution, and role-hiding are handled by the server. That
is a real, complete "luồng chơi" (game flow); it is just missing the phone-in-pocket
and remote-play polish, which land in the next two sub-projects.

**Architecture (spec §6):** Players write their own actions directly to RTDB
(`actions/{phaseKey}/{uid}`). All phase transitions, role assignment, and night/day
resolution happen server-side in one endpoint, `POST /api/games/[gameId]/advance`,
using the Firebase Admin SDK — never trust a client to compute outcomes, since a
client can already see its own actions and any client-computed result would leak
information (e.g. a naive client-side "who died" computation would require sending
every role to every client first). Any device may call `advance`; a transaction on
`phase.version` makes repeated calls idempotent (spec §6.3).

## Global Constraints

- Every pure rules function (role distribution, phase sequencing, night resolution,
  win detection) must be implemented and unit-tested with **zero** Firebase
  dependency — no `Database`, no emulator, plain data in and out. The advance route
  itself is a thin adapter: read state from RTDB, call the pure functions, write the
  result. This is what makes the hardest logic in the whole project (§4.4's night
  resolution, the exact bug the old app got wrong) testable in milliseconds with
  Vitest, no emulator required.
- Firebase Admin SDK needs a service account credential. This plan cannot deploy or
  live-test the `advance` route without `FIREBASE_SERVICE_ACCOUNT_KEY` (or equivalent)
  set in Vercel — that credential must come from the project owner. Tasks that only
  need the pure functions do not block on this; the route-wiring task does, and must
  say so explicitly when it's reached rather than silently skipping verification.
- Role data never reaches a client that doesn't own it. `/private/{gameId}/{uid}` is
  written only by the Admin SDK and readable only by that uid (Security Rules).
  `/games/{gameId}/players/{uid}` (public) carries only `alive`/`muted`/`name` — never
  `role`.
- Keep reusing what Foundation & Lobby already built: `RoomSettings.rolesEnabled`
  (`src/types/room.ts`), the room member list, `db`/`auth` singletons. Don't
  re-invent a second settings shape.
- Every task ends with a commit directly to `main` (this repo's established
  convention — no PRs, no long-lived branches). Build + test before every commit.

## File Structure

```
src/
  types/
    game.ts                 RoleKey, PhaseName, GamePlayer, GameState, NightActions
  lib/
    game/
      roles.ts               wolfCount, buildRoleList, assignRoles
      phases.ts               PHASE_SEQUENCE, nextPhase (skip logic), phase durations
      resolveNight.ts         pure night-resolution engine (spec §4.4)
      resolveVote.ts           pure day-vote tally (spec §4.5)
      checkWinner.ts           pure win-condition check (spec §4.6)
      paths.ts                 RTDB path helpers for /games and /private
  app/
    api/games/[gameId]/advance/route.ts   the one server-authoritative endpoint
database.rules.json           extended with /games and /private (v2)
```

---

### Task 1: Game data types — STATUS: not started

`src/types/game.ts`: `RoleKey` (8 roles + the values already in
`OPTIONAL_ROLE_KEYS`), `Faction` (`VILLAGE | WOLF | TANNER`), `PhaseName` (the 12
phases from spec §4.3), `GamePlayer { name, alive, muted, wasProtectedLastNight }`,
`GamePhase { name, endsAt, version, requiredActors }`, `NightActions` shape matching
`actions/{phaseKey}/{uid}`.

### Task 2: Role distribution — STATUS: not started

`src/lib/game/roles.ts`: `wolfCount(n)`, `buildRoleList(n, rolesEnabled)`,
`assignRoles(uids, rolesEnabled)`. Implements spec §4.2 exactly (wolf count formula,
mandatory Seer/Witch/≥1 Villager, remaining slots filled Bodyguard → Cursed → Muter →
Tanner → Villager, skipping disabled optional roles). Vitest covers every n from 4 to
16 and several `rolesEnabled` combinations, asserting the resulting role list has the
exact expected composition.

### Task 3: Phase sequence and skip logic — STATUS: not started

`src/lib/game/phases.ts`: the ordered phase list with default durations from spec
§4.3, and `nextPhase(current, activeRoles)` that skips a role's phase entirely when
that role isn't in the game (not just disabled — "not present" per spec), and loops
DISCUSSION → VOTE → VOTE_RESULT back to NIGHT_FALLS. Tests cover a full lap with all
roles enabled, and a lap with several optional roles disabled to confirm their phases
are skipped.

### Task 4: Night resolution engine — STATUS: not started

`src/lib/game/resolveNight.ts`: implements spec §4.4's exact ordered algorithm
(protect vs. bite vs. cure vs. poison vs. first-bite-on-Cursed), explicitly as
sequential conditional steps — **not** set subtraction, which is the documented bug
in the old app (poison was incorrectly blockable by protect/cure). Tests assert: wolf
target survives when protected or cured; Cursed target transforms instead of dying on
first bite only; poison always kills regardless of protect/cure; a target hit by both
wolves and poison dies once, not double-counted.

### Task 5: Day vote resolution — STATUS: not started

`src/lib/game/resolveVote.ts`: tally votes among alive players, most votes dies, ties
(including all-abstain) mean nobody dies. Tests cover a clean majority, a tie, and an
all-abstain round.

### Task 6: Win condition check — STATUS: not started

`src/lib/game/checkWinner.ts`: implements spec §4.6's ordered check (Tanner death ends
the game immediately even if wolves/village conditions would also be true that same
round; then no-wolves-left; then wolves≥rest). Tests cover all three winners plus the
"game continues" case.

### Task 7: Security Rules v2 (`/games`, `/private`) — STATUS: not started

Extends `database.rules.json`: `actions/{phaseKey}/{uid}` writable only by that uid
while the phase is live; `players`/`phase`/`result` client-read-only; `private/{uid}`
readable only by that uid, writable only by the Admin SDK (i.e. no `.write` rule a
client can ever satisfy). Emulator-backed tests per the pattern in Task 6 of the
Foundation & Lobby plan — **note for whoever runs this**: the sandboxed session that
authored this plan could not reach `firebase-public.firebaseio.com` to run the
emulator's rules validation (network policy on that machine, not a code issue); these
tests need to run somewhere with normal internet access before this task is called
done.

### Task 8: The `advance` API route — STATUS: not started

`src/app/api/games/[gameId]/advance/route.ts`: reads current phase + actions from
RTDB via Admin SDK, calls the Task 2–6 pure functions, writes the new phase/players/
private-role data in one update. Guards re-entrancy with a `phase.version` transaction
(spec §6.3). **Blocked on `FIREBASE_SERVICE_ACCOUNT_KEY`** (or whatever env var name
the project owner sets in Vercel) — cannot be live-tested without it. Write the route
and unit-test its pure decision logic (already covered by Tasks 2–6); mark live
verification as a follow-up once the credential exists.

### Task 9: Gameplay screens — STATUS: not started

`/room/[code]/game/page.tsx` or similar: renders the current phase, your role (from
`/private`), the action UI for whichever role/phase requires input from you, and the
public player list with alive/muted state. This is the largest remaining task and
should probably become its own set of sub-tasks once Tasks 1–8 land — role-specific
action UI (wolf pick, seer look, witch save/kill, bodyguard protect, muter pick,
villager/discussion/vote) each need their own small component.
