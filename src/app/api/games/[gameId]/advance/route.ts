import { NextResponse } from "next/server";
import type { Database, DataSnapshot } from "firebase-admin/database";
import { adminDb } from "@/lib/firebase/admin";
import { planAdvance } from "@/lib/game/planAdvance";
import { tallyMajorityVote } from "@/lib/game/resolveNight";
import { requiredActorsForPhase, ACTING_ROLE_BY_PHASE } from "@/lib/game/requiredActors";
import { checkWinner } from "@/lib/game/checkWinner";
import { applyLoverDeaths } from "@/lib/game/resolveDeathExtras";
import {
  seerCheck,
  type Game,
  type GamePlayer,
  type PhaseName,
  type PrivatePlayerState,
  type RoleKey,
} from "@/types/game";
import { PHASE_DURATIONS_MS, DEAD_HOLDER_PHASE_DURATION_MS } from "@/lib/game/phases";

/**
 * The single server-authoritative phase-transition endpoint (spec §6.2/§6.3).
 * Any client may call this — the phase.version transaction below makes
 * repeated/concurrent calls a no-op after the first one wins, and the
 * readiness check before it means a call that lands too early (before
 * every required actor is done, and before endsAt) just returns the
 * current phase unchanged rather than skipping ahead.
 *
 * NOT LIVE-VERIFIED: this route needs FIREBASE_SERVICE_ACCOUNT_KEY, which the
 * sandboxed session that wrote it does not have (see the Game Engine plan's
 * Global Constraints). Its only real logic — deciding what happens — lives
 * in planAdvance() and is fully unit-tested; everything below is read/write
 * plumbing around that decision, kept deliberately thin for exactly this
 * reason. Confirm this route end-to-end against a real project before
 * trusting it in production.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ gameId: string }> },
): Promise<NextResponse> {
  const { gameId } = await params;
  const db = adminDb();

  const gameSnap = await db.ref(`games/${gameId}`).get();
  if (!gameSnap.exists()) {
    return NextResponse.json({ error: "Không tìm thấy ván đấu" }, { status: 404 });
  }
  const game = gameSnap.val() as Game;

  const [privateSnap, hunterShotSnap] = await Promise.all([
    db.ref(`private/${gameId}`).get(),
    db.ref(`actions/${gameId}/HUNTER_SHOT`).get(),
  ]);
  const privateState = (privateSnap.val() ?? {}) as Record<string, PrivatePlayerState>;

  // Spec §4.4 step 8: a Hunter's revenge shot is not phase-gated — it fires
  // reactively on death, whenever that happens, which is always AFTER the
  // phase transition that killed them has already committed. So it can
  // never ride along with planAdvance()'s single per-call phase decision
  // below; it needs its own pass, independent of whatever phase transition
  // (if any) this call is otherwise processing — including one that
  // already ended the game, which is why this check runs even before the
  // ENDED short-circuit right after it. Idempotent by construction: a shot
  // only counts as "pending" while its target is still alive, so
  // re-running this against an already-applied shot is a safe no-op.
  const pendingHunterKill = await applyPendingHunterShots(db, gameId, game, privateState, hunterShotSnap);
  if (pendingHunterKill) {
    return NextResponse.json(pendingHunterKill);
  }

  if (game.phase.name === "ENDED") {
    return NextResponse.json({ phase: game.phase, result: game.result ?? null });
  }

  const aliveRolesByUid: Record<string, RoleKey> = {};
  for (const [uid, player] of Object.entries(game.players)) {
    if ((player as GamePlayer).alive) {
      aliveRolesByUid[uid] = privateState[uid]?.role;
    }
  }

  // Spec §4.3: end the phase early only once every required actor is done;
  // otherwise wait for endsAt. Who's required is recomputed here from
  // /private on every call rather than ever being persisted to the public
  // games/{gameId}/phase node — for a role-specific phase (WOLVES, SEER,
  // ...) that list of uids *is* that role's membership, so writing it
  // anywhere a client can read would undo everything /private exists for.
  // An empty list (announcement-only phases) only counts as "ready" via
  // the time check below, never on its own.
  const currentPhaseActionsSnap = await db.ref(`actions/${gameId}/${game.phase.name}`).get();
  const currentActionsVal = (currentPhaseActionsSnap.val() ?? {}) as Record<string, { done?: boolean }>;
  const requiredActors = requiredActorsForPhase(game.phase.name, aliveRolesByUid);
  const allRequiredDone =
    requiredActors.length > 0 && requiredActors.every((uid) => currentActionsVal[uid]?.done);
  const timeUp = Date.now() >= game.phase.endsAt;
  if (!allRequiredDone && !timeUp) {
    return NextResponse.json({ phase: game.phase, notYet: true });
  }

  // Idempotency guard (spec §6.3): claim this exact version before doing any
  // work. A second caller reading the same pre-claim version loses the race
  // and gets `committed: false` — it does nothing further.
  const claim = await db.ref(`games/${gameId}/phase/version`).transaction((current) => {
    if (current !== game.phase.version) return; // someone already claimed it
    return current + 1;
  });
  if (!claim.committed) {
    const latest = await db.ref(`games/${gameId}/phase`).get();
    return NextResponse.json({ phase: latest.val() });
  }

  const [bodyguard, muter, wolves, witchSave, witchKill, vote] = await Promise.all([
    db.ref(`actions/${gameId}/BODYGUARD`).get(),
    db.ref(`actions/${gameId}/MUTER`).get(),
    db.ref(`actions/${gameId}/WOLVES`).get(),
    db.ref(`actions/${gameId}/WITCH_SAVE`).get(),
    db.ref(`actions/${gameId}/WITCH_KILL`).get(),
    db.ref(`actions/${gameId}/VOTE`).get(),
  ]);

  const activeRoles: RoleKey[] = Object.values(privateState).map((p) => p.role);
  const cursedUids = Object.entries(privateState)
    .filter(([, p]) => p.initialRole === "CURSED")
    .map(([uid]) => uid);
  // A Cursed player already showing role WEREWOLF has already transformed on
  // a previous night — resolveNight needs to know that to not re-transform.
  const alreadyTransformedCursed = Object.entries(privateState)
    .filter(([, p]) => p.initialRole === "CURSED" && p.role === "WEREWOLF")
    .map(([uid]) => uid);

  const lovers = findLoverPair(privateState);

  const bodyguardVal = (bodyguard.val() ?? {}) as Record<string, { target: string }>;
  const protectTarget = Object.values(bodyguardVal)[0]?.target ?? null;
  const muterVal = (muter.val() ?? {}) as Record<string, { target: string }>;
  const muteTarget = Object.values(muterVal)[0]?.target ?? null;
  const wolfVal = (wolves.val() ?? {}) as Record<string, { target: string }>;
  const wolfVotes = Object.fromEntries(
    Object.entries(wolfVal).map(([uid, action]) => [uid, action.target]),
  );
  const witchSaveVal = (witchSave.val() ?? {}) as Record<string, { target: string }>;
  const witchSaveTarget = Object.values(witchSaveVal)[0]?.target ?? null;
  const witchKillVal = (witchKill.val() ?? {}) as Record<string, { target: string }>;
  const witchPoisonTarget = Object.values(witchKillVal)[0]?.target ?? null;
  const voteVal = (vote.val() ?? {}) as Record<string, { target: string | null }>;
  const voteBallots = Object.fromEntries(
    Object.entries(voteVal).map(([uid, ballot]) => [uid, ballot.target]),
  );

  // Hunter shots are handled entirely by applyPendingHunterShots() above —
  // by the time a night/vote resolution runs, no dead-Hunter shot could
  // possibly exist yet (the Hunter doesn't even know they're dead until
  // this transition commits), so planAdvance never needs any here.
  const decision = planAdvance({
    currentPhase: game.phase.name,
    activeRoles,
    aliveRolesByUid,
    actions: {
      protectTarget,
      wolfVotes,
      witchSaveTarget,
      witchPoisonTarget,
      voteBallots,
      hunterShots: {},
    },
    cursedUids,
    alreadyTransformedCursed,
    lovers,
  });

  // Spec §4.3: a role-specific phase whose actor is alive ends the moment
  // they act; one dealt into the game but whose sole holder has since died
  // can only ever time out at its full normal duration, since nobody's left
  // to end it early — that pattern (always exactly the configured max) is
  // itself the leak the spec calls out. CURSED is deliberately absent from
  // ACTING_ROLE_BY_PHASE (it never has an actor, alive or dead), so it
  // never matches here and keeps using its own normal duration, same as
  // WOLVES/VOTE (never actor-less while the game is still running — the
  // faction would already have lost otherwise).
  const nextPhaseActingRole = ACTING_ROLE_BY_PHASE[decision.nextPhase];
  const nextPhaseHolderIsDead =
    nextPhaseActingRole !== undefined &&
    requiredActorsForPhase(decision.nextPhase, aliveRolesByUid).length === 0;

  const newPhase = {
    name: decision.nextPhase,
    endsAt:
      Date.now() +
      (nextPhaseHolderIsDead
        ? DEAD_HOLDER_PHASE_DURATION_MS
        : (PHASE_DURATIONS_MS[decision.nextPhase] ?? 0)),
    version: game.phase.version + 1,
  };

  const updates: Record<string, unknown> = {
    [`games/${gameId}/phase`]: newPhase,
  };

  // Every recurring role phase lives at the same actions/{gameId}/{phaseKey}
  // path on every single occurrence — there's no per-night or per-day
  // discriminator in it. Without this, a night-2 SEER/BODYGUARD/MUTER/
  // WOLVES/WITCH_SAVE/WITCH_KILL (or a new day's VOTE) would start with
  // last round's data already sitting there: a still-alive actor who
  // simply hasn't acted yet this round would read as `done` (fooling the
  // readiness gate above into ending the phase before they ever get a
  // turn), and a since-dead actor's old vote would still count in
  // tallyMajorityVote/resolveVote alongside this round's real ballots.
  // Clearing here, the moment we're about to enter that phase fresh, is
  // the one point guaranteed to run exactly once per occurrence and
  // strictly before anyone can write this round's data into it.
  const ROUND_SCOPED_PHASES: PhaseName[] = [
    "SEER",
    "BODYGUARD",
    "MUTER",
    "WOLVES",
    "WITCH_SAVE",
    "WITCH_KILL",
    "VOTE",
  ];
  if (ROUND_SCOPED_PHASES.includes(decision.nextPhase)) {
    updates[`actions/${gameId}/${decision.nextPhase}`] = null;
  }

  // Looping VOTE_RESULT -> NIGHT_FALLS (spec §4.3) is what starts a new day;
  // the very first NIGHT_FALLS (from REVEAL_ROLE or PAIR_LOVERS) is still day 1.
  if (game.phase.name === "VOTE_RESULT" && decision.nextPhase === "NIGHT_FALLS") {
    updates[`games/${gameId}/dayNumber`] = game.dayNumber + 1;
    // Spec §4.7: mute lasts one day ("hôm sau người đó không được nói") —
    // clear last night's Muter pick before tonight's MUTER phase, if any,
    // picks (or doesn't pick) a new one.
    for (const playerUid of Object.keys(game.players)) {
      updates[`games/${gameId}/players/${playerUid}/muted`] = false;
    }
  }

  // Leaving MUTER: apply this night's pick so it's in effect before
  // tomorrow's DISCUSSION (spec §4.7).
  if (game.phase.name === "MUTER" && muteTarget) {
    updates[`games/${gameId}/players/${muteTarget}/muted`] = true;
  }

  // Leaving WOLVES: spec §6.5 has the server write "nạn nhân đêm nay cho
  // Phù Thuỷ" into her own private state — not a publicly-readable field,
  // which is exactly what would leak the wolves' identities (see the
  // requiredActors fix). The Witch's client reads this instead of ever
  // touching actions/WOLVES/* directly.
  if (game.phase.name === "WOLVES") {
    const witchUid = Object.entries(privateState).find(([, p]) => p.role === "WITCH")?.[0];
    if (witchUid) {
      updates[`private/${gameId}/${witchUid}/pendingWolfTarget`] = tallyMajorityVote(wolfVotes);
    }
  }

  if (decision.nextPhase === "DAWN") {
    // Spec §4.1: the Bodyguard can't shield the same target two nights
    // running — the next BODYGUARD phase's UI reads this to exclude it.
    updates[`games/${gameId}/lastProtectedUid`] = protectTarget;

    // Spec §4.1: each potion is a single use for the whole game. Without
    // this, the Witch's private potions flags never change, and the
    // WITCH_SAVE/WITCH_KILL screens (which gate on them) would let her
    // save and poison every single night.
    const witchUid = Object.entries(privateState).find(([, p]) => p.role === "WITCH")?.[0];
    if (witchUid) {
      if (witchSaveTarget !== null) {
        updates[`private/${gameId}/${witchUid}/potions/heal`] = false;
      }
      if (witchPoisonTarget !== null) {
        updates[`private/${gameId}/${witchUid}/potions/poison`] = false;
      }
    }
  }

  for (const uid of decision.deaths) {
    updates[`games/${gameId}/players/${uid}/alive`] = false;
  }
  // resolveNight() treats the wolf bite and the Witch's poison as fully
  // independent (by design — see its own comment), so the same uid can come
  // back in both `deaths` (poisoned) and `transformedToWolf` (their first
  // bite, evaluated separately). Death wins: a poisoned player doesn't also
  // get folded into the pack and left there forever as a dead "packmate"
  // every alive wolf's ActionPanel would otherwise carry.
  const transformedAndAlive = decision.transformedToWolf.filter(
    (uid) => !decision.deaths.includes(uid),
  );
  if (transformedAndAlive.length > 0) {
    for (const uid of transformedAndAlive) {
      updates[`private/${gameId}/${uid}/role`] = "WEREWOLF";
    }
    // Spec §7: the pack needs to know a newly-turned Cursed player, and the
    // new wolf needs to know the rest of the pack — packUids was only ever
    // set once at game start, so without this, neither side would ever
    // find out about each other after tonight's transformation.
    const newPack = [
      ...Object.entries(privateState)
        .filter(([, p]) => p.role === "WEREWOLF" || p.role === "TRAITOR")
        .map(([packUid]) => packUid),
      ...transformedAndAlive,
    ];
    for (const packUid of newPack) {
      updates[`private/${gameId}/${packUid}/packUids`] = newPack.filter((u) => u !== packUid);
    }
  }
  if (decision.winner) {
    // Winner only — no role reveal, ever, even at game end.
    updates[`games/${gameId}/result`] = { winner: decision.winner };
    // Spec §4.6: "Phòng quay về sảnh, giữ nguyên người chơi để chơi ván
    // mới." Only the Admin SDK can ever move status off LOBBY or back, so
    // this is the one place that happens.
    updates[`rooms/${game.roomCode}/status`] = "LOBBY";
    for (const uid of Object.keys(game.players)) {
      updates[`rooms/${game.roomCode}/members/${uid}/ready`] = false;
    }
  }

  // Leaving SEER: the Seer's check result is theirs to know immediately,
  // not something to hold until dawn (spec §4.1's Tiên Tri entry).
  if (game.phase.name === "SEER") {
    const seerActionSnap = await db.ref(`actions/${gameId}/SEER`).get();
    const seerActionVal = (seerActionSnap.val() ?? {}) as Record<string, { target: string }>;
    const [seerUid, seerAction] = Object.entries(seerActionVal)[0] ?? [];
    const targetRole = seerAction ? privateState[seerAction.target]?.role : undefined;
    if (seerUid && seerAction && targetRole) {
      await db.ref(`private/${gameId}/${seerUid}/hints`).push({
        targetUid: seerAction.target,
        result: seerCheck(targetRole),
        dayNumber: game.dayNumber,
      });
    }
  }

  // Leaving PAIR_LOVERS: snapshot Cupid's one-time choice into both chosen
  // players' private state. Nothing reads games/*/actions/PAIR_LOVERS again
  // after this — resolveDeathExtras only needs the resulting `lovers` pair,
  // which future advance() calls derive by scanning /private (findLoverPair).
  if (game.phase.name === "PAIR_LOVERS") {
    const pairSnap = await db.ref(`actions/${gameId}/PAIR_LOVERS`).get();
    const pairVal = pairSnap.val() as Record<string, { targetA: string; targetB: string }> | null;
    const pair = pairVal ? Object.values(pairVal)[0] : null;
    if (pair) {
      updates[`private/${gameId}/${pair.targetA}/loverUid`] = pair.targetB;
      updates[`private/${gameId}/${pair.targetB}/loverUid`] = pair.targetA;
    }
  }

  await db.ref().update(updates);

  return NextResponse.json({ phase: newPhase, deaths: decision.deaths, winner: decision.winner });
}

/**
 * Applies any Hunter revenge shot whose target is still alive (spec §4.4
 * step 8). Independent of the phase clock and of planAdvance() by design —
 * see the long comment at its call site. Also re-checks the win condition
 * against the resulting alive roster, since a Hunter's shot can end the
 * game on its own (e.g. it kills the last wolf).
 *
 * Returns a response body if it did something (so the caller can respond
 * and stop), or null if there was nothing pending.
 */
async function applyPendingHunterShots(
  db: Database,
  gameId: string,
  game: Game,
  privateState: Record<string, PrivatePlayerState>,
  hunterShotSnap: DataSnapshot,
): Promise<{ phase: Game["phase"]; deaths: string[]; winner: string | null } | null> {
  const hunterShotVal = (hunterShotSnap.val() ?? {}) as Record<string, { target: string }>;

  const pendingTargets = Object.entries(hunterShotVal)
    .filter(([hunterUid, shot]) => {
      const hunterDead = game.players[hunterUid]?.alive === false;
      const targetAlive = game.players[shot.target]?.alive === true;
      return hunterDead && targetAlive;
    })
    .map(([, shot]) => shot.target);

  if (pendingTargets.length === 0) return null;

  const lovers = findLoverPair(privateState);
  const deaths = applyLoverDeaths([...new Set(pendingTargets)], lovers);

  const updates: Record<string, unknown> = {};
  for (const uid of deaths) {
    updates[`games/${gameId}/players/${uid}/alive`] = false;
  }

  // A game that already ended keeps its announced winner, full stop — see
  // GameScreen's isDeadHunterWithUnfiredShot comment. The shot still marks
  // its target dead for narrative completeness; it just can't reopen a
  // result the table has already been told.
  let newPhase = game.phase;
  let winner: string | null = game.result?.winner ?? null;

  if (game.phase.name !== "ENDED") {
    const aliveRoles: RoleKey[] = [];
    const deathsThisRoundRoles: RoleKey[] = [];
    const deathSet = new Set(deaths);
    for (const [uid, player] of Object.entries(game.players)) {
      const role = privateState[uid]?.role;
      if (!role) continue;
      if (deathSet.has(uid) || !(player as GamePlayer).alive) {
        if (deathSet.has(uid)) deathsThisRoundRoles.push(role);
      } else {
        aliveRoles.push(role);
      }
    }

    winner = checkWinner({ deathsThisRoundRoles, aliveRoles });
    if (winner) {
      newPhase = { name: "ENDED", endsAt: Date.now(), version: game.phase.version + 1 };
      updates[`games/${gameId}/phase`] = newPhase;
      updates[`games/${gameId}/result`] = { winner };
      updates[`rooms/${game.roomCode}/status`] = "LOBBY";
      for (const uid of Object.keys(game.players)) {
        updates[`rooms/${game.roomCode}/members/${uid}/ready`] = false;
      }
    }
  }

  await db.ref().update(updates);

  return { phase: newPhase, deaths, winner };
}

function findLoverPair(
  privateState: Record<string, PrivatePlayerState>,
): [string, string] | null {
  const withLover = Object.entries(privateState).find(([, p]) => p.loverUid);
  if (!withLover) return null;
  const [uid, state] = withLover;
  return state.loverUid ? [uid, state.loverUid] : null;
}
