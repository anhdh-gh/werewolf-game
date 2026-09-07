import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { planAdvance } from "@/lib/game/planAdvance";
import type { Game, GamePlayer, PrivatePlayerState, RoleKey } from "@/types/game";
import { PHASE_DURATIONS_MS } from "@/lib/game/phases";

/**
 * The single server-authoritative phase-transition endpoint (spec §6.2/§6.3).
 * Any client may call this — the phase.version transaction below makes
 * repeated/concurrent calls a no-op after the first one wins.
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

  const [privateSnap, bodyguard, wolves, witchSave, witchKill, vote, hunterShot] =
    await Promise.all([
      db.ref(`private/${gameId}`).get(),
      db.ref(`games/${gameId}/actions/BODYGUARD`).get(),
      db.ref(`games/${gameId}/actions/WOLVES`).get(),
      db.ref(`games/${gameId}/actions/WITCH_SAVE`).get(),
      db.ref(`games/${gameId}/actions/WITCH_KILL`).get(),
      db.ref(`games/${gameId}/actions/VOTE`).get(),
      db.ref(`games/${gameId}/actions/HUNTER_SHOT`).get(),
    ]);

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

  const updates: Record<string, unknown> = {
    [`games/${gameId}/phase`]: {
      name: decision.nextPhase,
      endsAt: Date.now() + (PHASE_DURATIONS_MS[decision.nextPhase] ?? 0),
      version: game.phase.version + 1,
      requiredActors: [],
    },
  };

  for (const uid of decision.deaths) {
    updates[`games/${gameId}/players/${uid}/alive`] = false;
  }
  for (const uid of decision.transformedToWolf) {
    updates[`private/${gameId}/${uid}/role`] = "WEREWOLF";
  }
  if (decision.winner) {
    updates[`games/${gameId}/result`] = {
      winner: decision.winner,
      revealedRoles: Object.fromEntries(
        Object.entries(privateState).map(([uid, p]) => [uid, p.role]),
      ),
    };
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

  return NextResponse.json({
    phase: updates[`games/${gameId}/phase`],
    deaths: decision.deaths,
    winner: decision.winner,
  });
}

function findLoverPair(
  privateState: Record<string, PrivatePlayerState>,
): [string, string] | null {
  const withLover = Object.entries(privateState).find(([, p]) => p.loverUid);
  if (!withLover) return null;
  const [uid, state] = withLover;
  return state.loverUid ? [uid, state.loverUid] : null;
}
