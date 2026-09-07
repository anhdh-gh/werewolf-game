import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { planAdvance } from "@/lib/game/planAdvance";
import { requiredActorsForPhase } from "@/lib/game/requiredActors";
import { seerCheck, type Game, type GamePlayer, type PrivatePlayerState, type RoleKey } from "@/types/game";
import { PHASE_DURATIONS_MS } from "@/lib/game/phases";

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

  if (game.phase.name === "ENDED") {
    return NextResponse.json({ phase: game.phase, result: game.result ?? null });
  }

  const [privateSnap, currentPhaseActions, bodyguard, wolves, witchSave, witchKill, vote, hunterShot] =
    await Promise.all([
      db.ref(`private/${gameId}`).get(),
      db.ref(`games/${gameId}/actions/${game.phase.name}`).get(),
      db.ref(`games/${gameId}/actions/BODYGUARD`).get(),
      db.ref(`games/${gameId}/actions/WOLVES`).get(),
      db.ref(`games/${gameId}/actions/WITCH_SAVE`).get(),
      db.ref(`games/${gameId}/actions/WITCH_KILL`).get(),
      db.ref(`games/${gameId}/actions/VOTE`).get(),
      db.ref(`games/${gameId}/actions/HUNTER_SHOT`).get(),
    ]);

  // Spec §4.3: end the phase early only once every required actor is done;
  // otherwise wait for endsAt. requiredActors is empty for announcement-only
  // phases (NIGHT_FALLS, DAWN, DISCUSSION, VOTE_RESULT, REVEAL_ROLE) — those
  // must never early-exit, so an empty list only counts as "ready" via the
  // time check, never on its own.
  const currentActionsVal = (currentPhaseActions.val() ?? {}) as Record<string, { done?: boolean }>;
  const allRequiredDone =
    game.phase.requiredActors.length > 0 &&
    game.phase.requiredActors.every((uid) => currentActionsVal[uid]?.done);
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

  const privateState = (privateSnap.val() ?? {}) as Record<string, PrivatePlayerState>;
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

  const aliveRolesByUid: Record<string, RoleKey> = {};
  for (const [uid, player] of Object.entries(game.players)) {
    if ((player as GamePlayer).alive) {
      aliveRolesByUid[uid] = privateState[uid]?.role;
    }
  }

  const bodyguardVal = (bodyguard.val() ?? {}) as Record<string, { target: string }>;
  const protectTarget = Object.values(bodyguardVal)[0]?.target ?? null;
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
  const hunterShotVal = (hunterShot.val() ?? {}) as Record<string, { target: string }>;
  const hunterShots = Object.fromEntries(
    Object.entries(hunterShotVal).map(([uid, shot]) => [uid, shot.target]),
  );

  const decision = planAdvance({
    currentPhase: game.phase.name,
    activeRoles,
    aliveRolesByUid,
    actions: { protectTarget, wolfVotes, witchSaveTarget, witchPoisonTarget, voteBallots, hunterShots },
    cursedUids,
    alreadyTransformedCursed,
    lovers,
  });

  const survivingRolesByUid: Record<string, RoleKey> = {};
  const deathSet = new Set(decision.deaths);
  const transformedSet = new Set(decision.transformedToWolf);
  for (const [uid, role] of Object.entries(aliveRolesByUid)) {
    if (!deathSet.has(uid)) {
      survivingRolesByUid[uid] = transformedSet.has(uid) ? "WEREWOLF" : role;
    }
  }

  const newPhase = {
    name: decision.nextPhase,
    endsAt: Date.now() + (PHASE_DURATIONS_MS[decision.nextPhase] ?? 0),
    version: game.phase.version + 1,
    requiredActors: requiredActorsForPhase(decision.nextPhase, survivingRolesByUid),
  };

  const updates: Record<string, unknown> = {
    [`games/${gameId}/phase`]: newPhase,
  };

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
  for (const uid of decision.transformedToWolf) {
    updates[`private/${gameId}/${uid}/role`] = "WEREWOLF";
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
    const seerActionSnap = await db.ref(`games/${gameId}/actions/SEER`).get();
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
    const pairSnap = await db.ref(`games/${gameId}/actions/PAIR_LOVERS`).get();
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

function findLoverPair(
  privateState: Record<string, PrivatePlayerState>,
): [string, string] | null {
  const withLover = Object.entries(privateState).find(([, p]) => p.loverUid);
  if (!withLover) return null;
  const [uid, state] = withLover;
  return state.loverUid ? [uid, state.loverUid] : null;
}
