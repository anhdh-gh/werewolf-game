/**
 * The resilience plan's (docs/superpowers/plans/2026-09-07-resilience.md)
 * last open checklist item is "chạy thử một ván nhiều thiết bị thật với
 * Chơi xa bật". Real devices aren't available here, but the part of that
 * which is actually mechanical — several INDEPENDENT client connections,
 * each with its own auth and each subject to the real Security Rules,
 * playing one game against one server — is, against the RTDB emulator.
 *
 * What this file adds over the tests that already exist:
 *   - rulesGames.test.ts checks rules one assertion at a time against
 *     hand-written state; here the state is whatever a real game produced.
 *   - gameFlowEndToEnd.test.ts plays whole games through the real routes,
 *     but against an in-memory fake with no rules and a single caller.
 *   Only here do the routes' writes and seven rule-enforced clients' reads
 *   and writes hit the same live database, so "every client ends up seeing
 *   the same game" is something that can be asserted rather than assumed.
 *
 * The routes run UNMODIFIED: only `@/lib/firebase/admin` is swapped, for a
 * rules-bypassing emulator connection (helpers/emulatorAdminDb.ts), which
 * is exactly the privilege the Admin SDK has in production.
 *
 * Needs the emulators — run it via `npm run test:ci`, not bare `vitest`.
 */

import { AsyncLocalStorage } from "node:async_hooks";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  type Database,
  type Unsubscribe,
  ref,
  get,
  set,
  onValue,
} from "firebase/database";
import { EmulatorAdminDatabase } from "./helpers/emulatorAdminDb";
import { createRoom } from "@/lib/rooms/createRoom";
import { joinRoom } from "@/lib/rooms/joinRoom";
import { roomSettingsPath, roomStatusPath } from "@/lib/rooms/paths";
import { submitAction } from "@/lib/game/actions";
import { sendChatMessage } from "@/lib/game/chat";
import { gameActionPath, gameChatPath, gamePath, privatePlayerPath } from "@/lib/game/paths";
import type { ChatMessage, Game, PrivatePlayerState, RoleKey } from "@/types/game";

const PROJECT_ID = "werewolf-multiclient-test";

/** Deck-builder change (2026-09-08): the room creator now sets an explicit
 * per-role count instead of an auto-computed formula. This deck (2 WEREWOLF +
 * SEER + WITCH + 3 VILLAGER, everything else off) is the same composition
 * the old formula produced for 7 players, kept explicit here since
 * production code no longer computes it — so the only phases in play are
 * NIGHT_FALLS / SEER / WOLVES / WITCH_SAVE / WITCH_KILL / DAWN / DISCUSSION /
 * VOTE / VOTE_RESULT. Which uid gets which role is still random (assignRoles
 * shuffles) — this file reads the deal back out of /private rather than
 * forcing it, so it exercises the real dealer.
 *
 * SEVEN and not fewer, because §4.6's headcount decides how long a game can
 * last: a 5-player deal is also 2 wolves, so the very first night kill
 * leaves 2 wolves against 2 villagers and the wolves win at DAWN before
 * DISCUSSION/VOTE ever happen. Seven gives 5 non-wolves, which is exactly
 * enough for the night-kill / day-hang / night-kill arc below to reach a
 * wolf win on night two — the shortest game that still exercises a full
 * day phase. */
const DECK_7_NO_OPTIONAL_ROLES: Record<RoleKey, number> = {
  WEREWOLF: 2,
  TRAITOR: 0,
  SORCERER: 0,
  WOLF_MAN: 0,
  WOLF_CUB: 0,
  SEER: 1,
  WITCH: 1,
  BODYGUARD: 0,
  HUNTER: 0,
  CUPID: 0,
  MUTER: 0,
  CURSED: 0,
  LYCAN: 0,
  MASON: 0,
  PRINCE: 0,
  PACIFIST: 0,
  VILLAGE_IDIOT: 0,
  BEHOLDER: 0,
  VILLAGER: 3,
  TANNER: 0,
};

const DECK_16_NO_OPTIONAL_ROLES: Record<RoleKey, number> = {
  ...DECK_7_NO_OPTIONAL_ROLES,
  WEREWOLF: 4,
  VILLAGER: 10,
};

/** Set only for the duration of one route call, so two route calls can be
 * genuinely in flight at once (the concurrent-advance test below) without
 * either seeing the other's database. A plain module-level variable would
 * hand the second caller the first caller's connection. */
const serverStore = new AsyncLocalStorage<EmulatorAdminDatabase>();
const sendEachForMulticast = vi.fn().mockResolvedValue({});

vi.mock("@/lib/firebase/admin", () => ({
  adminDb: () => serverStore.getStore(),
  adminMessaging: () => ({ sendEachForMulticast }),
}));

const { POST: startGame } = await import("@/app/api/rooms/[code]/start/route");
const { POST: advance } = await import("@/app/api/games/[gameId]/advance/route");

interface AdvanceResponse {
  phase: Game["phase"];
  notYet?: boolean;
  deaths?: string[];
  winner?: string | null;
  result?: { winner: string } | null;
}

/** One simulated device: its own authenticated connection plus whatever its
 * live subscription to games/{gameId} has told it so far. */
interface Client {
  uid: string;
  name: string;
  db: Database;
  game: Game | null;
  /** Every distinct `${phaseName}#${version}` this client was pushed. */
  phaseLog: string[];
  detach: Unsubscribe | null;
}

let testEnv: RulesTestEnvironment;
let clients: Client[] = [];
/** Authenticated, but never joins the room — the "wrong room" case. */
let outsiderDb: Database;

let roomCode: string;
let gameId: string;
let roles: Record<string, RoleKey> = {};
let wolves: string[] = [];
let seerUid: string;
let witchUid: string;
let villagers: string[] = [];

/**
 * Every `${phaseName}#${version}` a client is allowed to have been shown,
 * built from the advance route's own responses rather than from a hardcoded
 * script — so what fails is "a client saw something the server never
 * wrote", not "a client coalesced two updates it was entitled to skip".
 *
 * Each transition legitimately produces TWO of these. Spec §6.3's
 * idempotency guard claims the next version with its own transaction on
 * games/{id}/phase/version BEFORE the multi-path update that renames the
 * phase, so there is a real, observable moment where the phase still reads
 * `VOTE` but already reads version N+1. Harmless — every client is driven
 * by the phase NAME — but a listener can and does see it.
 */
const allowedPhaseEntries = new Set<string>(["REVEAL_ROLE#0"]);
let latestServerPhase: { name: string; version: number } = {
  name: "REVEAL_ROLE",
  version: 0,
};

function clientFor(uid: string): Client {
  const found = clients.find((client) => client.uid === uid);
  if (!found) throw new Error(`No client for ${uid}`);
  return found;
}

interface OpenServer {
  raw: Database;
  adapter: EmulatorAdminDatabase;
  detach: () => void;
}

/**
 * Brings one rules-bypassing connection up and waits until it is fully
 * synced before handing it over.
 *
 * The `onValue` on the root is not decoration: withSecurityRulesDisabled
 * builds a brand-new Firebase app each time, and the client SDK aborts a
 * transaction outright when its update function returns undefined on the
 * cold local cache — which the advance route's version claim always would.
 * Subscribing to the root and waiting for the first snapshot makes the
 * cache authoritative before any route code runs. See emulatorAdminDb.ts.
 */
async function openServer(context: {
  database: () => unknown;
}): Promise<OpenServer> {
  const raw = context.database() as Database;
  let unsubscribe: Unsubscribe;
  await new Promise<void>((resolve) => {
    unsubscribe = onValue(ref(raw), () => resolve());
  });
  return { raw, adapter: new EmulatorAdminDatabase(raw), detach: () => unsubscribe() };
}

/** Runs `fn` with the routes' `adminDb()` pointed at that connection, for
 * the lifetime of one call and no longer. */
async function withServer<T>(fn: (raw: Database) => Promise<T>): Promise<T> {
  let out: T;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const server = await openServer(context);
    try {
      out = await serverStore.run(server.adapter, () => fn(server.raw));
    } finally {
      server.detach();
    }
  });
  return out;
}

async function advanceOnce(adapter: EmulatorAdminDatabase): Promise<AdvanceResponse> {
  return serverStore.run(adapter, async () => {
    const res = await advance(new Request("http://x"), {
      params: Promise.resolve({ gameId }),
    });
    return res.json() as Promise<AdvanceResponse>;
  });
}

/**
 * Records what the server actually committed, so the clients' own phase
 * logs can be checked against it later.
 *
 * `deaths` is the tell for "this call is the one that won the version
 * claim and wrote the transition": every other branch of the advance route
 * (notYet, a lost claim, an already-ENDED game) answers with a phase but
 * no death list. Keying on that keeps this correct no matter which of two
 * racing calls happens to return first, since a loser's answer can carry
 * a phase that was already stale when it read it.
 */
function recordServerPhase(body: AdvanceResponse) {
  if (!body.phase || !Array.isArray(body.deaths)) return;
  const { name, version } = body.phase;
  // The transient the version-claim transaction leaves behind: last phase's
  // name already carrying this version.
  allowedPhaseEntries.add(`${latestServerPhase.name}#${version}`);
  allowedPhaseEntries.add(`${name}#${version}`);
  latestServerPhase = { name, version };
}

async function callStart(code: string): Promise<{ gameId?: string; error?: string }> {
  return withServer(async () => {
    const res = await startGame(new Request("http://x"), {
      params: Promise.resolve({ code }),
    });
    return res.json() as Promise<{ gameId?: string; error?: string }>;
  });
}

/**
 * One call to the real advance route. `expireTimer` backdates the current
 * phase's endsAt first (a server-side write, the same thing the wall clock
 * would eventually do) so announcement-only phases — NIGHT_FALLS, DAWN,
 * DISCUSSION, VOTE_RESULT, REVEAL_ROLE — don't cost this test 8 to 180
 * real seconds each.
 */
async function callAdvance(
  expireTimer: boolean = false,
): Promise<AdvanceResponse> {
  const body = await withServer(async (raw) => {
    if (expireTimer) {
      await set(ref(raw, `games/${gameId}/phase/endsAt`), Date.now() - 1);
    }
    return advanceOnce(serverStore.getStore()!);
  });
  recordServerPhase(body);
  return body;
}

/**
 * Two advance calls issued in the same tick, each on its own connection —
 * two phones whose submitAction both fired nudgeAdvance at once.
 *
 * Both connections are opened AND fully synced before either route call
 * starts, deliberately: if one were still handshaking while the other was
 * already several round trips into its own transition, the two would not
 * actually be racing, and the test would silently stop covering the thing
 * it exists to cover.
 */
async function raceTwoAdvances(): Promise<AdvanceResponse[]> {
  let out: AdvanceResponse[];
  await testEnv.withSecurityRulesDisabled(async (contextA) => {
    await testEnv.withSecurityRulesDisabled(async (contextB) => {
      const [a, b] = await Promise.all([openServer(contextA), openServer(contextB)]);
      try {
        out = await Promise.all([advanceOnce(a.adapter), advanceOnce(b.adapter)]);
      } finally {
        a.detach();
        b.detach();
      }
    });
  });
  for (const body of out) recordServerPhase(body);
  return out;
}

async function waitUntil(label: string, predicate: () => boolean, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) throw new Error(`Timed out waiting for ${label}`);
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
}

/**
 * Blocks until every client's own live subscription has landed on exactly
 * the phase the server just committed — the point at which comparing what
 * the seven of them believe is meaningful rather than a race.
 *
 * Matching on the name AND the version, never the version alone, is what
 * makes this safe: the version-claim transaction described above bumps the
 * version while the rest of the game node is still last phase's, so a
 * version-only wait would let an assertion read half-applied state.
 */
async function waitForEveryClientAt(name: string, version: number) {
  await waitUntil(
    `all clients at ${name}#${version}`,
    () =>
      clients.every(
        (client) =>
          client.game?.phase.name === name && client.game.phase.version === version,
      ),
  );
}

async function readServer<T>(path: string): Promise<T> {
  return withServer(async (raw) => (await get(ref(raw, path))).val() as T);
}

async function readChat(db: Database, scope: "village" | "wolves"): Promise<ChatMessage[]> {
  const snapshot = await get(ref(db, gameChatPath(gameId, scope)));
  const val = (snapshot.val() ?? {}) as Record<string, ChatMessage>;
  return Object.values(val).sort((a, b) => a.at - b.at);
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    database: {
      rules: readFileSync("database.rules.json", "utf8"),
      host: "127.0.0.1",
      port: 9000,
    },
  });
  await testEnv.clearDatabase();

  clients = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"].map((uid, index) => ({
    uid,
    name: `Người ${index + 1}`,
    db: testEnv.authenticatedContext(uid).database() as unknown as Database,
    game: null,
    phaseLog: [],
    detach: null,
  }));
  outsiderDb = testEnv.authenticatedContext("u8-outsider").database() as unknown as Database;
}, 60_000);

afterAll(async () => {
  for (const client of clients) client.detach?.();
  await testEnv?.cleanup();
});

describe("seven clients, one server, one game", () => {
  it("builds the room together under the real rules", async () => {
    roomCode = await createRoom(clients[0].db, {
      uid: clients[0].uid,
      name: clients[0].name,
      photoURL: null,
      roleCounts: DECK_7_NO_OPTIONAL_ROLES,
    });

    for (const client of clients.slice(1)) {
      await joinRoom(client.db, roomCode, {
        uid: client.uid,
        name: client.name,
        photoURL: null,
      });
    }

    // "Chơi xa" on, every optional role off — a member may rewrite settings
    // while the room is still in the lobby, and only then.
    await assertSucceeds(
      set(ref(clients[1].db, roomSettingsPath(roomCode)), {
        roleCounts: DECK_7_NO_OPTIONAL_ROLES,
        remoteMode: true,
      }),
    );

    // Someone who never joined can read the room but cannot reconfigure it.
    await assertSucceeds(get(ref(outsiderDb, roomStatusPath(roomCode))));
    await assertFails(
      set(ref(outsiderDb, roomSettingsPath(roomCode)), {
        roleCounts: DECK_16_NO_OPTIONAL_ROLES,
        remoteMode: false,
      }),
    );
  }, 60_000);

  it("deals one game that every client subscribes to independently", async () => {
    const started = await callStart(roomCode);
    expect(started.error).toBeUndefined();
    expect(started.gameId).toBeTruthy();
    gameId = started.gameId!;

    const privateState = await readServer<Record<string, PrivatePlayerState>>(
      `private/${gameId}`,
    );
    for (const client of clients) roles[client.uid] = privateState[client.uid].role;
    wolves = clients.filter((c) => roles[c.uid] === "WEREWOLF").map((c) => c.uid);
    seerUid = clients.find((c) => roles[c.uid] === "SEER")!.uid;
    witchUid = clients.find((c) => roles[c.uid] === "WITCH")!.uid;
    villagers = clients.filter((c) => roles[c.uid] === "VILLAGER").map((c) => c.uid);

    expect(wolves).toHaveLength(2);
    expect(villagers).toHaveLength(3);
    expect([seerUid, witchUid].every(Boolean)).toBe(true);

    for (const client of clients) {
      client.detach = onValue(ref(client.db, gamePath(gameId)), (snapshot) => {
        const game = snapshot.val() as Game | null;
        client.game = game;
        if (!game) return;
        const entry = `${game.phase.name}#${game.phase.version}`;
        if (client.phaseLog[client.phaseLog.length - 1] !== entry) client.phaseLog.push(entry);
      });
    }

    await waitForEveryClientAt("REVEAL_ROLE", 0);
    for (const client of clients) {
      expect(client.game!.phase.name).toBe("REVEAL_ROLE");
      // The public game node never carries anyone's role (spec §7) — that
      // is the whole reason /private is a separate tree.
      expect(JSON.stringify(client.game)).not.toContain("WEREWOLF");
    }

    // The room is PLAYING now, so its settings are frozen even for members.
    await assertFails(
      set(ref(clients[1].db, roomSettingsPath(roomCode)), {
        roleCounts: DECK_7_NO_OPTIONAL_ROLES,
        remoteMode: false,
      }),
    );
  }, 60_000);

  it("lets only the right client act, and only in the right phase", async () => {
    // Still REVEAL_ROLE: the Seer's own action write is refused purely on
    // the phase, before anyone has had a chance to look at roles.
    await assertFails(
      set(ref(clientFor(seerUid).db, gameActionPath(gameId, "SEER", seerUid)), {
        target: villagers[0],
        done: true,
        at: Date.now(),
      }),
    );

    expect((await callAdvance(true)).phase.name).toBe("NIGHT_FALLS");
    expect((await callAdvance(true)).phase.name).toBe("SEER");

    // Right phase now, but a role-specific action leaf is readable and
    // writable only by its owner — otherwise its mere existence would out
    // the Seer to the table.
    await assertFails(
      set(ref(clientFor(villagers[0]).db, gameActionPath(gameId, "SEER", seerUid)), {
        target: wolves[0],
        done: true,
        at: Date.now(),
      }),
    );
    await assertFails(get(ref(clientFor(villagers[0]).db, gameActionPath(gameId, "SEER", seerUid))));
    await assertFails(get(ref(clientFor(villagers[0]).db, privatePlayerPath(gameId, seerUid))));
    await assertSucceeds(get(ref(clientFor(seerUid).db, privatePlayerPath(gameId, seerUid))));

    await submitAction(clientFor(seerUid).db, gameId, "SEER", seerUid, wolves[0]);
    // Every required actor is done, so this needs no expired timer at all.
    expect((await callAdvance()).phase.name).toBe("WOLVES");

    const hints = await readServer<Record<string, { targetUid: string; result: string }>>(
      `private/${gameId}/${seerUid}/hints`,
    );
    expect(Object.values(hints ?? {})).toEqual([
      expect.objectContaining({ targetUid: wolves[0], result: "WOLF" }),
    ]);
  }, 60_000);

  it("resolves the night once, and every client agrees on who died", async () => {
    for (const wolfUid of wolves) {
      await submitAction(clientFor(wolfUid).db, gameId, "WOLVES", wolfUid, villagers[0]);
    }
    expect((await callAdvance()).phase.name).toBe("WITCH_SAVE");

    // Spec §6.5: the Witch learns tonight's victim through her own private
    // node, never by reading the wolves' votes.
    const witchPrivate = await get(
      ref(clientFor(witchUid).db, privatePlayerPath(gameId, witchUid)),
    );
    expect((witchPrivate.val() as PrivatePlayerState).pendingWolfTarget).toBe(villagers[0]);

    await submitAction(clientFor(witchUid).db, gameId, "WITCH_SAVE", witchUid, null);
    expect((await callAdvance()).phase.name).toBe("WITCH_KILL");
    await submitAction(clientFor(witchUid).db, gameId, "WITCH_KILL", witchUid, null);

    // Five non-wolves go into the night and four come out, so §4.6's
    // headcount (2 wolves vs 4) does not end it here — DAWN, not ENDED.
    const dawn = await callAdvance();
    expect(dawn.phase.name).toBe("DAWN");
    expect(dawn.deaths).toEqual([villagers[0]]);

    await waitForEveryClientAt(dawn.phase.name, dawn.phase.version);
    for (const client of clients) {
      expect(client.game!.players[villagers[0]].alive).toBe(false);
      expect(client.game!.lastDeaths).toEqual([villagers[0]]);
    }
    // Not just "each is right" but "all seven are the same object" — the
    // multi-device claim this whole file exists for.
    for (const client of clients.slice(1)) expect(client.game).toEqual(clients[0].game);
  }, 60_000);

  it("keeps village and wolf chat separate across the seven connections", async () => {
    expect((await callAdvance(true)).phase.name).toBe("DISCUSSION");

    await assertSucceeds(
      sendChatMessage(clientFor(seerUid).db, gameId, "village", seerUid, "Ai đó khả nghi"),
    );
    await assertSucceeds(
      sendChatMessage(clientFor(wolves[0]).db, gameId, "village", wolves[0], "Không phải tôi"),
    );
    // Dead players watch but cannot speak (spec §4.7).
    await assertFails(
      sendChatMessage(clientFor(villagers[0]).db, gameId, "village", villagers[0], "Tôi biết ai"),
    );
    await assertSucceeds(get(ref(clientFor(villagers[0]).db, gameChatPath(gameId, "village"))));
    // ...and nobody outside the game sees the table at all.
    await assertFails(get(ref(outsiderDb, gameChatPath(gameId, "village"))));

    await assertSucceeds(
      sendChatMessage(clientFor(wolves[1]).db, gameId, "wolves", wolves[1], "Đêm sau ăn Tiên Tri"),
    );
    await assertFails(get(ref(clientFor(seerUid).db, gameChatPath(gameId, "wolves"))));
    await assertFails(get(ref(clientFor(witchUid).db, gameChatPath(gameId, "wolves"))));

    const villageSeenBy = await Promise.all(
      clients.map((client) => readChat(client.db, "village")),
    );
    for (const seen of villageSeenBy) {
      expect(seen.map((m) => m.text)).toEqual(["Ai đó khả nghi", "Không phải tôi"]);
    }

    const packSeenBy = await Promise.all(
      wolves.map((wolfUid) => readChat(clientFor(wolfUid).db, "wolves")),
    );
    expect(packSeenBy[0]).toEqual(packSeenBy[1]);
    expect(packSeenBy[0].map((m) => m.text)).toEqual(["Đêm sau ăn Tiên Tri"]);
  }, 60_000);

  it("commits exactly one transition when two clients nudge the server at once", async () => {
    const voteStart = await callAdvance(true);
    expect(voteStart.phase.name).toBe("VOTE");
    const versionBeforeVote = voteStart.phase.version;

    // The table hangs one of its own, and not unanimously: the accused
    // votes back at a wolf, so §4.5's tally decides it 5 to 1 rather than
    // this being a case where every ballot happened to agree. Hanging a
    // wolf instead would leave 1 wolf against 4 and put a wolf win out of
    // reach; this leaves 2 against 3 — not a win yet (so VOTE_RESULT and
    // not ENDED), but one night kill away from one.
    const aliveUids = clients.filter((c) => c.uid !== villagers[0]).map((c) => c.uid);
    for (const uid of aliveUids) {
      const ballot = uid === villagers[1] ? wolves[0] : villagers[1];
      await submitAction(clientFor(uid).db, gameId, "VOTE", uid, ballot);
    }
    // Nobody may cast someone else's ballot, however loud the room gets.
    await assertFails(
      set(ref(clientFor(seerUid).db, gameActionPath(gameId, "VOTE", witchUid)), {
        target: witchUid,
        done: true,
        at: Date.now(),
      }),
    );

    // Two devices whose submitAction both fire nudgeAdvance at the same
    // instant — spec §6.3's idempotency guard has to make one of them a
    // no-op, or the table would skip a phase.
    const both = await raceTwoAdvances();
    const resolved = both.filter((res) => Array.isArray(res.deaths));
    expect(resolved).toHaveLength(1);
    expect(resolved[0].deaths).toEqual([villagers[1]]);
    expect(resolved[0].phase.name).toBe("VOTE_RESULT");
    expect(resolved[0].phase.version).toBe(versionBeforeVote + 1);

    await waitForEveryClientAt("VOTE_RESULT", versionBeforeVote + 1);
    for (const client of clients) {
      expect(client.game!.phase.version).toBe(versionBeforeVote + 1);
      expect(client.game!.players[villagers[1]].alive).toBe(false);
    }
  }, 60_000);

  it("plays night two to a wolf win and leaves all seven clients identical", async () => {
    const nightTwo = await callAdvance(true);
    expect(nightTwo.phase.name).toBe("NIGHT_FALLS");
    await waitForEveryClientAt(nightTwo.phase.name, nightTwo.phase.version);
    for (const client of clients) expect(client.game!.dayNumber).toBe(2);

    expect((await callAdvance(true)).phase.name).toBe("SEER");
    await submitAction(clientFor(seerUid).db, gameId, "SEER", seerUid, witchUid);
    expect((await callAdvance()).phase.name).toBe("WOLVES");

    // Night one's wolf ballots must not still be sitting there.
    const wolfActions = await readServer<Record<string, unknown>>(`actions/${gameId}/WOLVES`);
    expect(wolfActions).toBeNull();

    for (const wolfUid of wolves) {
      await submitAction(clientFor(wolfUid).db, gameId, "WOLVES", wolfUid, villagers[2]);
    }
    expect((await callAdvance()).phase.name).toBe("WITCH_SAVE");
    await submitAction(clientFor(witchUid).db, gameId, "WITCH_SAVE", witchUid, null);
    expect((await callAdvance()).phase.name).toBe("WITCH_KILL");
    await submitAction(clientFor(witchUid).db, gameId, "WITCH_KILL", witchUid, null);

    // The last villager dies, leaving 2 wolves against the Seer and the
    // Witch: spec §4.6's headcount (wolves ≥ everyone else) ends it here,
    // so this transition goes straight to ENDED instead of DAWN.
    const ending = await callAdvance();
    expect(ending.phase.name).toBe("ENDED");
    expect(ending.winner).toBe("WOLF");

    await waitForEveryClientAt(ending.phase.name, ending.phase.version);
    await waitUntil("every client sees the result", () =>
      clients.every((client) => client.game?.result?.winner === "WOLF"),
    );

    for (const client of clients) {
      expect(client.game!.phase.name).toBe("ENDED");
      expect(client.game!.result).toEqual({ winner: "WOLF" });
      // Still no role reveal, even at game end.
      expect(JSON.stringify(client.game)).not.toContain("WEREWOLF");

      // Nobody was ever shown a phase the server did not commit, and
      // nobody ever went backwards.
      const versions = client.phaseLog.map((entry) => Number(entry.split("#")[1]));
      expect(versions).toEqual([...versions].sort((a, b) => a - b));
      for (const entry of client.phaseLog) {
        expect([entry, [...allowedPhaseEntries].includes(entry)]).toEqual([entry, true]);
      }
      expect(client.phaseLog[client.phaseLog.length - 1]).toBe(
        `ENDED#${ending.phase.version}`,
      );
    }

    for (const client of clients.slice(1)) expect(client.game).toEqual(clients[0].game);

    // Spec §4.6: the room drops back to the lobby with everyone still in it.
    const room = await readServer<{ status: string; members: Record<string, { ready: boolean }> }>(
      `rooms/${roomCode}`,
    );
    expect(room.status).toBe("LOBBY");
    expect(Object.keys(room.members)).toHaveLength(7);
    expect(Object.values(room.members).every((member) => member.ready === false)).toBe(true);
  }, 60_000);
});
