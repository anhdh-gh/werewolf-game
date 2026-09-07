// End-to-end regression coverage for the two route handlers that actually
// run the game (src/app/api/rooms/[code]/start/route.ts and
// src/app/api/games/[gameId]/advance/route.ts), against the real production
// code — not a re-implementation of its logic. Every one of Task 10's 11
// audit bugs (see docs/superpowers/plans/2026-09-07-game-engine.md) was in
// route orchestration/persistence, invisible to the pure-function unit
// tests that already existed; this file plays full games through the
// routes themselves so a regression in "who reads/writes what, when" gets
// caught even though no live Firebase is reachable here (see
// rulesGames.test.ts's network note — same constraint, same reason).
//
// The routes talk to Firebase only via `adminDb()` from
// src/lib/firebase/admin.ts, so that's the only thing mocked — everything
// downstream (planAdvance, resolveNight, checkWinner, ...) runs unmodified.

import { beforeEach, describe, expect, it, vi } from "vitest";
import { FakeAdminDatabase } from "./helpers/fakeAdminDb";
import type { Game, PrivatePlayerState } from "@/types/game";
import type { Room } from "@/types/room";

const fakeDb = new FakeAdminDatabase();

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: () => fakeDb,
}));

const { POST: startGame } = await import("@/app/api/rooms/[code]/start/route");
const { POST: advance } = await import("@/app/api/games/[gameId]/advance/route");

function makeParams<T extends object>(value: T) {
  return { params: Promise.resolve(value) };
}

async function callStart(code: string) {
  const res = await startGame(new Request("http://x"), makeParams({ code }));
  return res.json() as Promise<{ gameId?: string; error?: string }>;
}

/** The advance route's response shape varies by which branch it took
 * (notYet / a pending Hunter shot / a normal transition) — one wide type
 * covering every field any branch can return, rather than re-asserting a
 * different narrow shape at each call site (which would fight `let`'s
 * type inference across reassignments). */
interface AdvanceResponse {
  phase: Game["phase"];
  notYet?: boolean;
  deaths?: string[];
  winner?: string | null;
  result?: { winner: string } | null;
}

async function callAdvance(gameId: string): Promise<AdvanceResponse> {
  const res = await advance(new Request("http://x"), makeParams({ gameId }));
  return res.json() as Promise<AdvanceResponse>;
}

const NO_OPTIONAL_ROLES = {
  BODYGUARD: false,
  TRAITOR: false,
  HUNTER: false,
  CUPID: false,
  MUTER: false,
  CURSED: false,
  LYCAN: false,
  TANNER: false,
};

async function writeAction(
  gameId: string,
  phaseKey: string,
  uid: string,
  target: string | null,
) {
  await fakeDb.ref(`actions/${gameId}/${phaseKey}/${uid}`).set({ target, done: true, at: 1 });
}

async function getGame(gameId: string): Promise<Game> {
  return (await fakeDb.ref(`games/${gameId}`).get()).val() as Game;
}

async function getPrivate(gameId: string): Promise<Record<string, PrivatePlayerState>> {
  return (await fakeDb.ref(`private/${gameId}`).get()).val() as Record<
    string,
    PrivatePlayerState
  >;
}

/** Every advance() response's `phase` (and the persisted one) must only ever
 * carry these three keys — Bug #10 of the audit was `requiredActors` living
 * here, which for a role-specific phase directly names the role's holders. */
function assertPhaseShapeNeverLeaksRoles(phase: unknown) {
  expect(phase).toBeTruthy();
  expect(Object.keys(phase as object).sort()).toEqual(["endsAt", "name", "version"]);
}

/** Force whatever phase is currently live to have already timed out, so a
 * timer-only phase (NIGHT_FALLS, DAWN, DISCUSSION, VOTE_RESULT, REVEAL_ROLE)
 * advances on the next call without needing anyone to act. */
async function expirePhaseTimer(gameId: string) {
  const game = await getGame(gameId);
  await fakeDb.ref(`games/${gameId}/phase/endsAt`).set(Date.now() - 1);
  return game;
}

beforeEach(() => {
  fakeDb.root = {};
  fakeDb.counter = 0;
});

async function seedRoom(code: string, uids: string[], rolesEnabled: typeof NO_OPTIONAL_ROLES) {
  const members: Room["members"] = {};
  for (const uid of uids) {
    members[uid] = { name: uid, photoURL: null, joinedAt: 1, ready: true, online: true };
  }
  const room: Room = {
    createdAt: 1,
    status: "LOBBY",
    settings: { maxPlayers: uids.length, rolesEnabled },
    members,
  };
  await fakeDb.ref(`rooms/${code}`).set(room);
}

describe("full game, no optional roles — start -> ... -> VILLAGE win", () => {
  it("drives every phase through the real routes and lands on a clean, role-free result", async () => {
    // 7 players -> wolfCount(7) === 2, so the first night's single kill
    // (2 wolves vs 4 others) doesn't already satisfy checkWinner's "wolves
    // >= everyone else" — the game has to actually reach a vote.
    const uids = ["p1", "p2", "p3", "p4", "p5", "p6", "p7"];
    await seedRoom("ABCDEF", uids, NO_OPTIONAL_ROLES);

    const { gameId } = await callStart("ABCDEF");
    if (!gameId) throw new Error("start route did not return a gameId");

    let game = await getGame(gameId);
    expect(game.phase.name).toBe("REVEAL_ROLE");
    expect(game.dayNumber).toBe(1);
    assertPhaseShapeNeverLeaksRoles(game.phase);

    const priv = await getPrivate(gameId);
    const wolfUids = uids.filter((u) => priv[u].role === "WEREWOLF");
    const seerUid = uids.find((u) => priv[u].role === "SEER")!;
    const witchUid = uids.find((u) => priv[u].role === "WITCH")!;
    const villagerUid = uids.find((u) => priv[u].role === "VILLAGER")!;
    expect(wolfUids.length).toBeGreaterThan(0);
    expect(seerUid).toBeTruthy();
    expect(witchUid).toBeTruthy();
    expect(villagerUid).toBeTruthy();

    // REVEAL_ROLE has nobody required to act — only the clock moves it.
    await expirePhaseTimer(gameId);
    let res = await callAdvance(gameId);
    assertPhaseShapeNeverLeaksRoles(res.phase);
    expect(res.phase.name).toBe("NIGHT_FALLS"); // no CUPID -> PAIR_LOVERS is skipped

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("SEER");

    // --- Bug #1 regression: calling advance before the required actor has
    // acted must NOT transition the phase, even though the readiness check
    // runs on every call.
    const stalled = await callAdvance(gameId);
    expect(stalled.notYet).toBe(true);
    expect(stalled.phase.version).toBe((await getGame(gameId)).phase.version);

    await writeAction(gameId, "SEER", seerUid, wolfUids[0]);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WOLVES"); // BODYGUARD/MUTER both disabled -> skipped

    // Bug #11 regression: the Seer's check actually got written somewhere
    // she can read it back from.
    const seerPriv = (await getPrivate(gameId))[seerUid];
    const hint = Object.values(seerPriv.hints ?? {})[0];
    expect(hint).toEqual({ targetUid: wolfUids[0], result: "WOLF", dayNumber: 1 });

    // Only the alive wolves are required — write for all of them so a >1
    // wolf count (wolfCount(7) === 2) doesn't stall on partial input.
    for (const w of wolfUids) await writeAction(gameId, "WOLVES", w, villagerUid);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_SAVE");

    // Bug #2 regression: the Witch learns the wolves' pick from her own
    // private state, never from a publicly-readable wolves' action log.
    const witchPendingTarget = (await getPrivate(gameId))[witchUid].pendingWolfTarget;
    expect(witchPendingTarget).toBe(villagerUid);

    await writeAction(gameId, "WITCH_SAVE", witchUid, null); // don't save
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_KILL");

    await writeAction(gameId, "WITCH_KILL", witchUid, null); // don't poison
    res = await callAdvance(gameId);
    // CURSED is disabled -> this is the transition that actually resolves
    // the night (planAdvance only runs resolveNight on the call whose
    // nextPhase is DAWN).
    expect(res.phase.name).toBe("DAWN");
    expect(res.deaths).toEqual([villagerUid]);

    // Bug #5 regression: unused potions are NOT consumed.
    const witchAfterNight = (await getPrivate(gameId))[witchUid];
    expect(witchAfterNight.potions).toEqual({ heal: true, poison: true });

    game = await getGame(gameId);
    expect(game.players[villagerUid].alive).toBe(false);
    expect(game.result).toBeUndefined();

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DISCUSSION");

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("VOTE");

    // Hang the first wolf; everyone still alive votes for it.
    const aliveNow = uids.filter((u) => u !== villagerUid);
    for (const voter of aliveNow) await writeAction(gameId, "VOTE", voter, wolfUids[0]);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("VOTE_RESULT");
    expect(res.deaths).toEqual([wolfUids[0]]);

    game = await getGame(gameId);
    // wolfCount(7) is 2, so with only one wolf hanged the pack isn't wiped
    // yet (1 wolf vs 4 others) — the game must keep going, not end here.
    expect(res.winner).toBeNull();
    expect(game.result).toBeUndefined();

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("NIGHT_FALLS");
    // Bug #6 regression: dayNumber increments exactly on the
    // VOTE_RESULT -> NIGHT_FALLS loop transition.
    game = await getGame(gameId);
    expect(game.dayNumber).toBe(2);

    // --- Round 2: the last wolf bites another villager, then the table
    // hangs the last wolf, wiping the pack -> a deterministic VILLAGE win.
    const lastWolf = wolfUids[1];
    const remainingVillagers = uids.filter(
      (u) => priv[u].role === "VILLAGER" && u !== villagerUid,
    );
    const villager2Uid = remainingVillagers[0];

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("SEER");
    await writeAction(gameId, "SEER", seerUid, villager2Uid);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WOLVES");

    await writeAction(gameId, "WOLVES", lastWolf, villager2Uid);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_SAVE");
    await writeAction(gameId, "WITCH_SAVE", witchUid, null);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_KILL");
    await writeAction(gameId, "WITCH_KILL", witchUid, null);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DAWN");
    expect(res.deaths).toEqual([villager2Uid]);

    await expirePhaseTimer(gameId);
    await callAdvance(gameId); // -> DISCUSSION
    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("VOTE");

    const aliveNow2 = uids.filter(
      (u) => u !== villagerUid && u !== wolfUids[0] && u !== villager2Uid,
    );
    for (const voter of aliveNow2) await writeAction(gameId, "VOTE", voter, lastWolf);
    res = await callAdvance(gameId);
    expect(res.deaths).toEqual([lastWolf]);
    expect(res.winner).toBe("VILLAGE");
    expect(res.phase.name).toBe("ENDED");

    game = await getGame(gameId);
    // Bug #10 regression: the result carries the winning faction and
    // NOTHING else — no role list, ever, even at game end.
    expect(game.result).toEqual({ winner: "VILLAGE" });
    assertPhaseShapeNeverLeaksRoles(game.phase);

    const room = (await fakeDb.ref("rooms/ABCDEF").get()).val() as Room;
    expect(room.status).toBe("LOBBY");
    for (const uid of uids) expect(room.members[uid].ready).toBe(false);

    const ended = await callAdvance(gameId);
    expect(ended.phase.name).toBe("ENDED");
  });
});

describe("optional roles wired through the real routes: MUTER, TRAITOR pack, CURSED transform", () => {
  const gameId = "GAME-2";
  const roomCode = "OPTROOM";
  const wolfA = "wolfA";
  const traitor = "traitor";
  const seer = "seer";
  const witch = "witch";
  const muter = "muter";
  const cursed = "cursed";
  const villager1 = "villager1";
  const villager2 = "villager2";
  const uids = [wolfA, traitor, seer, witch, muter, cursed, villager1, villager2];

  beforeEach(async () => {
    const players: Game["players"] = {};
    for (const uid of uids) players[uid] = { name: uid, alive: true, muted: false };

    const game: Game = {
      roomCode,
      startedAt: 1,
      dayNumber: 1,
      phase: { name: "NIGHT_FALLS", endsAt: Date.now() - 1, version: 0 },
      players,
    };
    await fakeDb.ref(`games/${gameId}`).set(game);

    const priv: Record<string, PrivatePlayerState> = {
      [wolfA]: {
        role: "WEREWOLF",
        initialRole: "WEREWOLF",
        potions: { heal: true, poison: true },
        packUids: [traitor],
      },
      [traitor]: {
        role: "TRAITOR",
        initialRole: "TRAITOR",
        potions: { heal: true, poison: true },
        packUids: [wolfA],
      },
      [seer]: { role: "SEER", initialRole: "SEER", potions: { heal: true, poison: true } },
      [witch]: { role: "WITCH", initialRole: "WITCH", potions: { heal: true, poison: true } },
      [muter]: { role: "MUTER", initialRole: "MUTER", potions: { heal: true, poison: true } },
      [cursed]: { role: "CURSED", initialRole: "CURSED", potions: { heal: true, poison: true } },
      [villager1]: {
        role: "VILLAGER",
        initialRole: "VILLAGER",
        potions: { heal: true, poison: true },
      },
      [villager2]: {
        role: "VILLAGER",
        initialRole: "VILLAGER",
        potions: { heal: true, poison: true },
      },
    };
    await fakeDb.ref(`private/${gameId}`).set(priv);
    await seedRoom(roomCode, uids, {
      ...NO_OPTIONAL_ROLES,
      TRAITOR: true,
      MUTER: true,
      CURSED: true,
    });
    await fakeDb.ref(`rooms/${roomCode}/status`).set("PLAYING");
  });

  it("mutes the Muter's pick, transforms the bitten Cursed player, and rebuilds the pack", async () => {
    let res = await callAdvance(gameId);
    expect(res.phase.name).toBe("SEER"); // NIGHT_FALLS -> SEER, timer only

    await writeAction(gameId, "SEER", seer, wolfA);
    res = await callAdvance(gameId);
    // Bug #3 regression: CURSED never blocks a transition demanding an
    // action from it — but that's not this phase; BODYGUARD is disabled so
    // this should land straight on MUTER.
    expect(res.phase.name).toBe("MUTER");

    await writeAction(gameId, "MUTER", muter, villager1);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WOLVES");

    // Bug #7 regression: the Muter's pick is actually applied the moment
    // MUTER's phase ends.
    let game = await getGame(gameId);
    expect(game.players[villager1].muted).toBe(true);

    // Only WEREWOLF is required for WOLVES — the Traitor never wakes with
    // the pack (spec §4.1); bite the Cursed player.
    await writeAction(gameId, "WOLVES", wolfA, cursed);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_SAVE");

    await writeAction(gameId, "WITCH_SAVE", witch, null); // don't heal
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_KILL");

    await writeAction(gameId, "WITCH_KILL", witch, villager2); // poison
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("CURSED"); // active this game, timer only, no UI

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DAWN");
    // Only the poisoned villager actually dies — the Cursed player's bite
    // transforms them instead (spec §4.1's "cắn lần đầu thì hoá sói").
    expect(res.deaths).toEqual([villager2]);

    game = await getGame(gameId);
    expect(game.players[cursed].alive).toBe(true);
    expect(game.players[villager2].alive).toBe(false);
    expect(game.lastProtectedUid ?? null).toBeNull(); // BODYGUARD disabled this game

    // Bug #5 regression again, this time with an actually-used poison.
    const witchAfter = (await getPrivate(gameId))[witch];
    expect(witchAfter.potions).toEqual({ heal: true, poison: false });

    // Bug #8 regression: the newly-turned wolf is folded into everyone's
    // packUids, not just left off the list.
    const privAfter = await getPrivate(gameId);
    expect(privAfter[cursed].role).toBe("WEREWOLF");
    expect(new Set(privAfter[wolfA].packUids)).toEqual(new Set([traitor, cursed]));
    expect(new Set(privAfter[traitor].packUids)).toEqual(new Set([wolfA, cursed]));
    expect(new Set(privAfter[cursed].packUids)).toEqual(new Set([wolfA, traitor]));

    // Discussion/vote: hang the original wolf. 3 wolf-faction (wolfA,
    // traitor, cursed) vs 4 others (seer, witch, muter, villager1) alive
    // going in — voting wolfA out should NOT end the game yet (2 vs 4).
    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DISCUSSION");
    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("VOTE");

    for (const voter of [seer, witch, muter, villager1]) {
      await writeAction(gameId, "VOTE", voter, wolfA);
    }
    for (const voter of [wolfA, traitor, cursed]) {
      await writeAction(gameId, "VOTE", voter, villager1);
    }
    res = await callAdvance(gameId);
    expect(res.winner).toBeNull();
    expect(res.phase.name).toBe("VOTE_RESULT");

    game = await getGame(gameId);
    expect(game.players[wolfA].alive).toBe(false);
    expect(game.dayNumber).toBe(1); // not incremented yet — only on the loop transition

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("NIGHT_FALLS");

    game = await getGame(gameId);
    // Bug #6 regression.
    expect(game.dayNumber).toBe(2);
    // Muted status resets for the new day.
    expect(game.players[villager1].muted).toBe(false);
    expect(game.result).toBeUndefined();
  });

  it("Bug #13 regression: a poisoned Cursed player stays dead — the Witch's independent poison doesn't get overridden by the same-night bite transformation", async () => {
    // resolveNight() evaluates the wolf bite and the Witch's poison
    // completely independently (by design), so the exact same uid can land
    // in both `deaths` (poisoned) and `transformedToWolf` (their first
    // bite) when the wolves bite the Cursed player and the Witch
    // separately poisons that same person on the same night. Death must
    // win — the route must not also turn them into a "wolf" and leave a
    // dead uid sitting in every other wolf's packUids forever.
    let res = await callAdvance(gameId);
    expect(res.phase.name).toBe("SEER");
    await writeAction(gameId, "SEER", seer, wolfA);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("MUTER");
    await writeAction(gameId, "MUTER", muter, villager1);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WOLVES");

    await writeAction(gameId, "WOLVES", wolfA, cursed);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_SAVE");
    await writeAction(gameId, "WITCH_SAVE", witch, null);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_KILL");
    // Poison the exact same uid the wolves just bit.
    await writeAction(gameId, "WITCH_KILL", witch, cursed);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("CURSED");
    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DAWN");
    expect(res.deaths).toEqual([cursed]);

    const game = await getGame(gameId);
    expect(game.players[cursed].alive).toBe(false);

    const privAfter = await getPrivate(gameId);
    // Still holds their original role — never "transformed" into a wolf
    // they immediately died as.
    expect(privAfter[cursed].role).toBe("CURSED");
    // Neither pack member's list was ever touched — the dead Cursed player
    // is nowhere in it.
    expect(privAfter[wolfA].packUids).toEqual([traitor]);
    expect(privAfter[traitor].packUids).toEqual([wolfA]);
  });
});

describe("Hunter's revenge shot (Bug #4 / #9): applied via the independent pending-shot pass", () => {
  it("kills the Hunter's target on the request after the shot is submitted, mid-game, without waiting for the next phase transition", async () => {
    const gameId = "GAME-3";
    const roomCode = "HUNTROOM";
    const hunter = "hunter";
    const wolf = "wolf";
    const seer = "seer";
    const witch = "witch";
    const villager = "villager";
    const uids = [hunter, wolf, seer, witch, villager];

    const players: Game["players"] = {};
    for (const uid of uids) players[uid] = { name: uid, alive: true, muted: false };
    // hunter already dead from an earlier, unrelated night — game is
    // mid-DISCUSSION, well past any phase transition, exactly the case
    // Bug #9 was about: nothing else will ever re-check HUNTER_SHOT for us.
    players[hunter].alive = false;

    const game: Game = {
      roomCode,
      startedAt: 1,
      dayNumber: 2,
      phase: { name: "DISCUSSION", endsAt: Date.now() + 60_000, version: 5 },
      players,
    };
    await fakeDb.ref(`games/${gameId}`).set(game);
    await fakeDb.ref(`private/${gameId}`).set({
      [hunter]: { role: "HUNTER", initialRole: "HUNTER", potions: { heal: true, poison: true } },
      [wolf]: { role: "WEREWOLF", initialRole: "WEREWOLF", potions: { heal: true, poison: true } },
      [seer]: { role: "SEER", initialRole: "SEER", potions: { heal: true, poison: true } },
      [witch]: { role: "WITCH", initialRole: "WITCH", potions: { heal: true, poison: true } },
      [villager]: {
        role: "VILLAGER",
        initialRole: "VILLAGER",
        potions: { heal: true, poison: true },
      },
    } satisfies Record<string, PrivatePlayerState>);
    await seedRoom(roomCode, uids, NO_OPTIONAL_ROLES);
    await fakeDb.ref(`rooms/${roomCode}/status`).set("PLAYING");

    // Nothing pending yet — advance should behave completely normally
    // (DISCUSSION isn't over, nobody required to act -> notYet).
    let res = await callAdvance(gameId);
    expect(res.notYet).toBe(true);

    await writeAction(gameId, "HUNTER_SHOT", hunter, seer);

    // The very next call must short-circuit into applying the kill,
    // independent of whatever phase is live.
    res = await callAdvance(gameId);
    expect(res.deaths).toEqual([seer]);
    expect(res.phase.name).toBe("DISCUSSION"); // untouched — this pass never advances phase

    const game2 = await getGame(gameId);
    expect(game2.players[seer].alive).toBe(false);
    expect(game2.phase.version).toBe(5); // no phase transition happened

    // A second call must be a no-op for the shot (target already dead) and
    // fall through to ordinary phase logic again.
    res = await callAdvance(gameId);
    expect(res.notYet).toBe(true);
  });

  it("still fires even when the Hunter's own death is the one that ends the game", async () => {
    const gameId = "GAME-4";
    const roomCode = "HUNTROOM2";
    const hunter = "hunter";
    const wolf = "wolf";
    const villager = "villager";
    const uids = [hunter, wolf, villager];

    const players: Game["players"] = {
      [hunter]: { name: hunter, alive: false, muted: false },
      [wolf]: { name: wolf, alive: true, muted: false },
      [villager]: { name: villager, alive: true, muted: false },
    };
    // Wolves already wiped everyone but themselves except the villager —
    // the Hunter's death (already applied) is what triggered VILLAGE... no,
    // here it triggers nothing yet: 1 wolf vs 1 villager, still contested,
    // until the Hunter's revenge shot removes the last villager and hands
    // the Wolves the win.
    const game: Game = {
      roomCode,
      startedAt: 1,
      dayNumber: 3,
      phase: { name: "DAWN", endsAt: Date.now() + 5000, version: 10 },
      players,
    };
    await fakeDb.ref(`games/${gameId}`).set(game);
    await fakeDb.ref(`private/${gameId}`).set({
      [hunter]: { role: "HUNTER", initialRole: "HUNTER", potions: { heal: true, poison: true } },
      [wolf]: { role: "WEREWOLF", initialRole: "WEREWOLF", potions: { heal: true, poison: true } },
      [villager]: {
        role: "VILLAGER",
        initialRole: "VILLAGER",
        potions: { heal: true, poison: true },
      },
    } satisfies Record<string, PrivatePlayerState>);
    await seedRoom(roomCode, uids, NO_OPTIONAL_ROLES);
    await fakeDb.ref(`rooms/${roomCode}/status`).set("PLAYING");

    await writeAction(gameId, "HUNTER_SHOT", hunter, villager);
    const res = await callAdvance(gameId);
    expect(res.deaths).toEqual([villager]);
    expect(res.winner).toBe("WOLF");
    expect(res.phase.name).toBe("ENDED");

    const game2 = await getGame(gameId);
    expect(game2.result).toEqual({ winner: "WOLF" });
    assertPhaseShapeNeverLeaksRoles(game2.phase);
    const room = (await fakeDb.ref(`rooms/${roomCode}`).get()).val() as Room;
    expect(room.status).toBe("LOBBY");
  });
});

describe("Cupid + cross-faction lovers: PAIR_LOVERS through the real routes, death cascade", () => {
  it("pairs via start's optional-role dealing, then a bitten lover's death drags their (wolf-faction) partner down too", async () => {
    // wolfCount(8) === 2; only CUPID enabled -> buildRoleList's single pass
    // over OPTIONAL_ROLE_KEYS adds exactly one CUPID (TANNER etc. all off),
    // rest fall to VILLAGER: 2 WEREWOLF, SEER, WITCH, CUPID, 3 VILLAGER.
    const uids = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8"];
    await seedRoom("LOVE01", uids, { ...NO_OPTIONAL_ROLES, CUPID: true });

    const { gameId } = await callStart("LOVE01");
    if (!gameId) throw new Error("start route did not return a gameId");

    const priv = await getPrivate(gameId);
    const wolfUids = uids.filter((u) => priv[u].role === "WEREWOLF");
    const cupidUid = uids.find((u) => priv[u].role === "CUPID")!;
    const witchUid = uids.find((u) => priv[u].role === "WITCH")!;
    const villagerUids = uids.filter((u) => priv[u].role === "VILLAGER");
    expect(wolfUids.length).toBe(2);
    expect(cupidUid).toBeTruthy();
    expect(villagerUids.length).toBe(3);

    let game = await getGame(gameId);
    expect(game.phase.name).toBe("REVEAL_ROLE");

    await expirePhaseTimer(gameId);
    let res = await callAdvance(gameId);
    expect(res.phase.name).toBe("PAIR_LOVERS"); // CUPID active -> not skipped

    // Cross-faction pair: one wolf + one villager, so the cascade below
    // actually removes a wolf from the pack, not just another villager.
    const wolfLover = wolfUids[0];
    const villagerLover = villagerUids[0];
    await fakeDb.ref(`actions/${gameId}/PAIR_LOVERS/${cupidUid}`).set({
      targetA: wolfLover,
      targetB: villagerLover,
      done: true,
      at: 1,
    });
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("NIGHT_FALLS");

    const privAfterPairing = await getPrivate(gameId);
    expect(privAfterPairing[wolfLover].loverUid).toBe(villagerLover);
    expect(privAfterPairing[villagerLover].loverUid).toBe(wolfLover);

    await expirePhaseTimer(gameId);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("SEER");
    await writeAction(gameId, "SEER", uids.find((u) => priv[u].role === "SEER")!, wolfLover);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WOLVES"); // BODYGUARD/MUTER disabled -> skipped

    // The pack (including the wolf who's in the pair) bites the OTHER
    // wolf's own lover — the villager half of the pair. Neither wolf is
    // the bite target, so this isn't the "self-sacrifice" case; it's
    // purely the lover-cascade pulling a WOLF down via their partner's
    // death, unrelated to who did the biting.
    for (const w of wolfUids) await writeAction(gameId, "WOLVES", w, villagerLover);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_SAVE");
    await writeAction(gameId, "WITCH_SAVE", witchUid, null);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("WITCH_KILL");
    await writeAction(gameId, "WITCH_KILL", witchUid, null);
    res = await callAdvance(gameId);
    expect(res.phase.name).toBe("DAWN");

    // Bug regression check for resolveDeathExtras wiring end to end: both
    // halves of the pair die, even though only one was actually bitten.
    expect(new Set(res.deaths)).toEqual(new Set([villagerLover, wolfLover]));

    game = await getGame(gameId);
    expect(game.players[villagerLover].alive).toBe(false);
    expect(game.players[wolfLover].alive).toBe(false);
    // The winner check already accounts for the cascade death, not just
    // the direct bite — one wolf left (wolfUids[1]) vs 5 others alive
    // (seer, witch, cupid, 2 remaining villagers), so no winner yet.
    expect(game.result).toBeUndefined();
  });
});
