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

### Task 1: Game data types — STATUS: done

`src/types/game.ts`: `RoleKey` (8 roles + the values already in
`OPTIONAL_ROLE_KEYS`), `Faction` (`VILLAGE | WOLF | TANNER`), `PhaseName` (the 12
phases from spec §4.3), `GamePlayer { name, alive, muted, wasProtectedLastNight }`,
`GamePhase { name, endsAt, version, requiredActors }`, `NightActions` shape matching
`actions/{phaseKey}/{uid}`.

### Task 2: Role distribution — STATUS: done

`src/lib/game/roles.ts`: `wolfCount(n)`, `buildRoleList(n, rolesEnabled)`,
`assignRoles(uids, rolesEnabled)`. Implements spec §4.2 exactly (wolf count formula,
mandatory Seer/Witch/≥1 Villager, remaining slots filled Bodyguard → Cursed → Muter →
Tanner → Villager, skipping disabled optional roles). Vitest covers every n from 4 to
16 and several `rolesEnabled` combinations, asserting the resulting role list has the
exact expected composition.

### Task 3: Phase sequence and skip logic — STATUS: done

`src/lib/game/phases.ts`: the ordered phase list with default durations from spec
§4.3, and `nextPhase(current, activeRoles)` that skips a role's phase entirely when
that role isn't in the game (not just disabled — "not present" per spec), and loops
DISCUSSION → VOTE → VOTE_RESULT back to NIGHT_FALLS. Tests cover a full lap with all
roles enabled, and a lap with several optional roles disabled to confirm their phases
are skipped.

### Task 4: Night resolution engine — STATUS: done

`src/lib/game/resolveNight.ts`: implements spec §4.4's exact ordered algorithm
(protect vs. bite vs. cure vs. poison vs. first-bite-on-Cursed), explicitly as
sequential conditional steps — **not** set subtraction, which is the documented bug
in the old app (poison was incorrectly blockable by protect/cure). Tests assert: wolf
target survives when protected or cured; Cursed target transforms instead of dying on
first bite only; poison always kills regardless of protect/cure; a target hit by both
wolves and poison dies once, not double-counted.

### Task 5: Day vote resolution — STATUS: done

`src/lib/game/resolveVote.ts`: tally votes among alive players, most votes dies, ties
(including all-abstain) mean nobody dies. Tests cover a clean majority, a tie, and an
all-abstain round.

### Task 6: Win condition check — STATUS: done

`src/lib/game/checkWinner.ts`: implements spec §4.6's ordered check (Tanner death ends
the game immediately even if wolves/village conditions would also be true that same
round; then no-wolves-left; then wolves≥rest). Tests cover all three winners plus the
"game continues" case.

### Task 7: Security Rules v2 (`/games`, `/private`) — STATUS: done

Extends `database.rules.json`: `actions/{phaseKey}/{uid}` writable only by that uid
while the phase is live; `players`/`phase`/`result` client-read-only; `private/{uid}`
readable only by that uid, writable only by the Admin SDK (i.e. no `.write` rule a
client can ever satisfy). Emulator-backed tests per the pattern in Task 6 of the
Foundation & Lobby plan — **note for whoever runs this**: the sandboxed session that
authored this plan could not reach `firebase-public.firebaseio.com` to run the
emulator's rules validation (network policy on that machine, not a code issue); these
tests need to run somewhere with normal internet access before this task is called
done.

### Task 8: The `advance` API route — STATUS: done (code written, not live-verified)

`src/app/api/games/[gameId]/advance/route.ts`: reads current phase + actions from
RTDB via Admin SDK, calls the Task 2–6 pure functions, writes the new phase/players/
private-role data in one update. Guards re-entrancy with a `phase.version` transaction
(spec §6.3). **Blocked on `FIREBASE_SERVICE_ACCOUNT_KEY`** (or whatever env var name
the project owner sets in Vercel) — cannot be live-tested without it. Write the route
and unit-test its pure decision logic (already covered by Tasks 2–6); mark live
verification as a follow-up once the credential exists.

### Task 6b: Roster expanded to 12 roles, plus seerCheck and death-extras — STATUS: done

Not in the original task breakdown — added mid-plan at the user's explicit request to
maximize role variety, prioritizing Wolf and Village over the Riêng (solo) faction.
Added Traitor (wolf, Seer-invisible), Lycan (village, Seer-false-positive), Hunter
(on-death revenge kill), and Cupid (one-time lover pairing, shared death). This
touched every task above (`FACTION_BY_ROLE`, `OPTIONAL_ROLE_KEYS`, the rules
validator, `createRoom`'s defaults) plus two new pure modules:
`src/lib/game/seerCheck.ts` (the one place that knows Traitor/Lycan are exceptions)
and `src/lib/game/resolveDeathExtras.ts` (lover heartbreak + Hunter revenge,
composable, independently tested). Spec §4.1/4.2/4.3/4.4 updated to match. Full
lovers-become-their-own-faction win condition explicitly deferred — noted in the spec.

### Task 9: Gameplay screens — STATUS: done (code written, not live-verified)

`/room/[code]/game/page.tsx`: renders the current phase, your role (hold-to-peek,
behind `/private`), the action UI for whichever role/phase requires input from you,
and the public player list with alive/muted state. Also added `POST
/api/rooms/[code]/start` (role dealing + game creation — not explicitly named in the
spec but required by §3's "anyone can press Start") and wired a Start button into
RoomLobby. Every visual state was screenshotted through a temporary mock-data route
(deleted before committing) to confirm it renders and responds to taps correctly.

Two gaps flagged at first ("Bodyguard can repeat a target", "a wolf can target a
fellow wolf") are now fixed: the pack sees each other via `packUids` in private state
(spec §7 requires this explicitly — "danh sách đồng bọn cho Sói" — and it's also what
lets the target picker exclude packmates), and `lastProtectedUid` on the public game
object lets the Bodyguard screen exclude last night's target.

## What's left before any of this runs live

Everything above is code-complete and unit-tested wherever it can be without live
infrastructure, but **none of it has run against a real Firebase project** — this
sandboxed session has no network path to `firebase-public.firebaseio.com` (blocks the
emulator's rules validation) or to any live Firebase/Vercel endpoint. Before trusting
this in production:

1. **Deploy the v2 rules**: `firebase deploy --only database --project werewolf-game-2026`
   (same as Foundation & Lobby's Task 6, now covering `/games` and `/private` too).
2. **Set `FIREBASE_SERVICE_ACCOUNT_KEY`** in Vercel (Project Settings → Environment
   Variables) — a service account JSON for `werewolf-game-2026`, generated from
   Firebase Console → Project Settings → Service Accounts. Without it, both API
   routes throw immediately (`src/lib/firebase/admin.ts`'s explicit check, not a
   silent failure).
3. **Run a real 4+ player game once** end to end and fix whatever the first live run
   surfaces — this is a lot of new orchestration logic (12 roles, a 14-phase state
   machine, three interlocking death-cascade rules) that has only ever run inside
   Vitest, never against real concurrent clients and real network latency.

### Task 6c: No role reveal, ever — not even at game end — STATUS: done

User override of spec §4.6's original "kết thúc ván thì lật toàn bộ vai của mọi
người" (most werewolf games reveal roles at the end; this one deliberately never
does). `GameResult` is now just `{ winner }` — no `revealedRoles` field exists
anywhere in the schema, so there is nothing for a compromised client or a future
mistake to leak. `GameEndScreen` shows the winning faction and who survived (already
public all game) instead of a role list. Spec §4.6/§7 rewritten to state this as the
"đừng gửi" principle from §12 applied without the usual end-of-game exception.

### Task 10: Post-Task-9 correctness audit — STATUS: done

Once the whole engine + UI existed end to end, went through it line by line looking
for "the route reads or decides something but never persists the effect" bugs — the
kind Vitest's unit tests can't catch because each pure function was individually
correct; the gap was always in the route's read/write plumbing around them. Found and
fixed, in order:

1. **No readiness gate at all** — the route transitioned on every call, so the first
   player to act would force-advance the whole table past everyone else.
2. **Wolves didn't know their own pack**, and could target a teammate; **Bodyguard
   could reshield the same person every night** — spec §7/§4.1 both violated.
3. **CURSED phase demanded an action from a role with nothing to click**, stalling
   every single night to its full duration for no reason.
4. **A Hunter whose own death ended the game never got their revenge shot** —
   GameScreen short-circuited straight to the end screen.
5. **The Witch's potions were never consumed** — she could save and poison every
   night, unlimited, for the whole game.
6. **`dayNumber` never incremented** — permanently "Ngày 1" no matter how many
   nights passed.
7. **The Muter's pick was read nowhere** — `muted` never became true for anyone.
8. **`packUids` never updated when a Cursed player transformed** — neither side of
   the pack ever found out about the other.
9. **The Hunter's shot was never applied at all**, in the general case, not just the
   game-ending edge case from #4 — `planAdvance` only ever consults `hunterShots`
   while resolving the transition that kills them, but the Hunter can't submit a
   shot until after that transition already committed and they're dead. Needed its
   own independent pass (`applyPendingHunterShots`), run on every request.
10. **The single most serious one**: `GamePhase.requiredActors` — every uid who had
    to act a given phase — was stored on the public `games/{gameId}/phase` node and
    rendered as a literal per-player marker in `PlayerList`. For any role-specific
    phase that list *is* the role membership (every Werewolf during WOLVES, the Seer
    during SEER, ...) — this leaked exactly the information `/private` exists to
    hide, to the entire table, every night. Root cause went deeper than one field:
    RTDB read grants cascade from parent to child with no way for a child to opt
    back out, so nesting `actions/{phaseKey}/{uid}` under `games/{gameId}` (which
    has `.read: auth != null`) made every role-specific action publicly readable
    too, regardless of what `.read` was written at the leaf — the mere existence of
    an entry (only the real role-holder could have written it) outed them. Fixed by
    moving `requiredActors` off the public object entirely (recomputed from
    `/private` on every server call; each client derives its own "is it my turn"
    from its own role only) and moving `actions` to its own top-level tree with
    self-read-only rules (VOTE excepted, since voting isn't role-specific).
11. **The Seer's check results were computed and stored but never displayed** —
    `hints` existed in her private state with nothing in the UI ever reading it back.

None of this was reachable by the unit tests, which only ever exercised the pure
functions with hand-built inputs — it took reading planAdvance()'s actual callers end
to end to find. Still not live-verified (same blockers as everything else in this
plan) — this is as much correctness confidence as static reading and Vitest can buy
without a real Firebase project and real concurrent players.

### Task 11: End-to-end route tests (in-memory fake Admin DB) — STATUS: done

User request: since live Firebase still isn't reachable from this sandbox, get as
much of "end to end" as unit tests can actually buy. Added
`src/test/helpers/fakeAdminDb.ts` — a minimal in-memory stand-in for the Admin SDK's
`Database` (`ref().get/set/update/transaction/push`), and mocked
`@/lib/firebase/admin`'s `adminDb()` to return it. `src/test/gameFlowEndToEnd.test.ts`
then imports and calls the **real** `start` and `advance` route handlers directly (not
a re-implementation) and plays full games through them — start → REVEAL_ROLE → nights
→ votes → ENDED — asserting on persisted state after each transition. This is real
regression coverage for exactly the class of bug Task 10 found (route
orchestration/persistence), which the pure-function tests structurally cannot catch.
Does not replace `rulesGames.test.ts` (Security Rules enforcement still needs the
real RTDB emulator, unreachable here) — this only proves the routes' own read/write
logic is correct assuming the rules allow the write.

Writing it immediately found one more real bug:

12. **Round-scoped actions were never cleared between rounds.** Every recurring role
    phase (SEER, BODYGUARD, MUTER, WOLVES, WITCH_SAVE, WITCH_KILL, VOTE) lives at the
    same `actions/{gameId}/{phaseKey}` path on every single occurrence — there's no
    per-night or per-day discriminator in it. Two consequences, both real: (a) a
    still-alive actor who simply hasn't acted *yet* this round would read as `done`
    from their *previous* round's stale write, fooling the readiness gate into ending
    the phase before they ever got a turn; (b) a since-dead actor's stale vote from
    an earlier round stayed in the tally forever, corrupting `tallyMajorityVote` /
    `resolveVote` on every later round (this is what the test actually caught: a
    dead wolf's night-1 bite target tied against the surviving wolf's fresh night-2
    pick, so `tallyMajorityVote` returned null and nobody got bitten). Fixed in
    `advance/route.ts` by clearing `actions/{gameId}/{phaseKey}` at the moment the
    route transitions *into* that phase — the one point guaranteed to run exactly
    once per occurrence, strictly before anyone can write that round's data.
13. **A poisoned Cursed player could end up simultaneously "dead" and "turned into a
    wolf".** `resolveNight()` deliberately evaluates the wolf bite and the Witch's
    poison as fully independent branches (its own doc comment explains why: no set
    subtraction, so a protect/cure aimed at someone else never accidentally saves a
    poison victim). Independent cuts both ways though — if the wolves bite the Cursed
    player (first bite -> `transformed`, not `deaths`) and the Witch separately
    poisons that *same* uid the *same* night, that uid comes back in both
    `decision.deaths` and `decision.transformedToWolf`. The route applied both
    effects: marked them dead **and** flipped their private role to WEREWOLF and
    folded them into every other wolf's `packUids` — a dead uid permanently listed as
    a live wolf's teammate. Fixed by excluding anyone in `decision.deaths` from the
    transform-to-wolf application; death wins. Caught by a new end-to-end test
    (`gameFlowEndToEnd.test.ts`, "Bug #13 regression") that bites and poisons the
    same Cursed uid in one night and asserts they stay CURSED, stay out of every
    packUids list, and end up dead.

Also added 3 more end-to-end scenarios closing coverage gaps (no new bugs, just
previously-untested real paths): Cupid's PAIR_LOVERS dealt via `start`'s own
optional-role slotting plus the cross-faction lover death cascade wired through the
real route; the Tanner solo win (voted out, overriding the normal faction-headcount
check even with both wolves still alive).

### Task 12: Cross-checking the spec line by line against "is this actually built" — STATUS: done

User asked directly: "are all the role cards and the full game flow really 100% done?"
Rather than reflexively saying yes, re-read spec §4.1 and §4.3–§4.7 role-by-role and
requirement-by-requirement against the actual code, instead of re-scanning files
already audited. Found two real gaps — both genuinely missing, not just under-tested:

1. **The Traitor never learned who their pack was.** Spec §4.1: "Kẻ Phản Bội biết hết
   đồng bọn sói." `packUids` was written to their private state at game start (Task
   10 already covers that plumbing), but the only place anything ever displayed it
   was `ActionPanel`'s WOLVES branch — which the Traitor correctly never opens, since
   they never wake for WOLVES (spec: "không thức đêm, không tham gia cắn"). Data
   existed, no UI ever showed it to them, for the whole game. Fixed with a new
   standing `PackInfo` card (same pattern as `RoleCard`/`SeerHints`) shown whenever
   `privateState.packUids` is non-empty — covers Werewolves, the Traitor, and a
   Cursed player who transformed mid-game, all without being gated behind any
   phase/required-actor check. `ActionPanel`'s inline packmate line (now redundant)
   removed.
2. **No timing-decoy for a dead role-holder's phase.** Spec §4.3, explicit and easy
   to miss on a first read: "Nếu vai có mặt nhưng người giữ vai đã chết, phase vẫn
   chạy với thời lượng giả 15 giây — nếu không, người khác sẽ suy ra được vai nào đã
   chết chỉ bằng cách bấm giờ." A live actor's phase ends the instant they act
   (usually well under its configured duration); a dead actor's phase can only ever
   time out at the FULL configured duration, since nobody's left to end it early —
   over a few nights, "this phase always takes exactly its max, every single time"
   is itself a tell that the role died. The route was using each phase's normal
   `PHASE_DURATIONS_MS` unconditionally, with no check for this at all. Fixed:
   `phases.ts` adds `DEAD_HOLDER_PHASE_DURATION_MS = 15_000` (deliberately matching
   CURSED's own duration, which is *always* actor-less by design, so a dead-holder
   phase is timing-indistinguishable from it); the route now checks, for whatever
   phase it's about to enter, whether that phase has an acting role
   (`ACTING_ROLE_BY_PHASE`, now exported from `requiredActors.ts`) AND that role's
   `requiredActorsForPhase(...)` comes back empty — meaning the role was dealt into
   the game (not skipped) but its holder has since died — and uses the decoy
   duration instead of the phase's own. WOLVES/VOTE are naturally excluded (never
   actor-less while the game continues — that faction would already have lost);
   CURSED is naturally excluded too (absent from `ACTING_ROLE_BY_PHASE` by design,
   since it's *always* actor-less regardless of alive/dead). Covered by two new
   end-to-end tests asserting the actual `endsAt` gap: ~15s for BODYGUARD with its
   holder already dead, ~30s (its normal duration) with the holder alive.

Also (§4.7, not a gap — a check): the muted-player table-wide "câm" badge was already
implemented (`PlayerList`), but the OTHER required half — "người bị câm nhận thông
báo rõ ràng trên máy mình" (a clear notification on the muted player's own device) —
had no UI at all. Added `MutedBanner`, a standing banner shown on the muted player's
own screen. (§4.7's chat-lockout/mic-lockout layer is explicitly "Chơi xa" mode —
LiveKit voice — which is the separate, deferred Resilience sub-project; this only
covers the "Luôn luôn, ở mọi chế độ" baseline the spec says is required and
sufficient on its own.)

Both role-card-table requirements and the phase-flow requirements in §4.1–§4.7 are
now cross-checked line by line against the implementation — not just re-read; each
row was checked against actual code before deciding it needed no change.

Continuing that same cross-check into §7's data model turned up a third item — not a
spec violation this time (an existing code comment shows it was a deliberate original
design choice), but a real UX gap given the user's own stated priority ("UI đẹp, UX
tốt"): DAWN's and VOTE_RESULT's whole *point*, per their own names in §4.3, is to
announce what happened ("công bố người chết", "kết quả bỏ phiếu") — but nothing ever
actually announced it. The only signal was `players/{uid}/alive` quietly flipping,
visible only if you happened to notice PlayerList's strikethrough change. No
persisted, reactive "who died" data existed anywhere — `nudgeAdvance()` and
`useAutoAdvance()` both fire-and-discard the advance() response, so even the one
client whose request won the version race never displayed it.

Added `Game.lastDeaths?: string[]` (public — reveals nothing `players` doesn't
already reveal, since deaths are public regardless of role-hiding), written by the
route at exactly the two points `decision.deaths` is meaningful (`nextPhase ===
"DAWN"` for the night, `"VOTE_RESULT"` for the vote) and left untouched on every
other transition, so it survives through DISCUSSION for players to actually read
before a later, unrelated transition would otherwise stomp it back to `[]`. New
`DeathAnnouncement` component renders it only during the phase window it's relevant
to (DAWN/DISCUSSION for the night wording, VOTE_RESULT for the hang wording) so a
stale previous round's announcement never lingers into an unrelated phase.
`database.rules.json` and `rulesGames.test.ts` updated for the new field (client
write denied, matching every other public-but-server-only `games/{gameId}` field).
Covered by new end-to-end assertions on the existing full-game test, and rendering
verified via a temporary dev-preview route (deleted before the commit).
