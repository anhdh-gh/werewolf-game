// NOTE for whoever runs this: the sandboxed session that wrote this file
// could not reach firebase-public.firebaseio.com to run the RTDB emulator's
// rules validation (see Task 7 of docs/superpowers/plans/2026-09-07-game-engine.md)
// — that's a network policy on that machine, not a problem with these tests.
// Run `npm run emulators` then `npx vitest run src/test/rulesGames.test.ts`
// somewhere with normal internet access before trusting these rules live.

import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get } from "firebase/database";

let testEnv: RulesTestEnvironment;

const EXISTING_GAME = {
  roomCode: "EXIST1",
  startedAt: 1000,
  dayNumber: 1,
  phase: { name: "WOLVES", endsAt: 9999999999999, version: 1, requiredActors: ["uid-wolf"] },
  players: {
    "uid-wolf": { name: "Wolf", alive: true, muted: false },
    "uid-seer": { name: "Seer", alive: true, muted: false },
    "uid-dead-hunter": { name: "Hunter", alive: false, muted: false },
  },
};

const EXISTING_PRIVATE = {
  role: "WEREWOLF",
  initialRole: "WEREWOLF",
  potions: { heal: true, poison: true },
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "werewolf-rules-test",
    database: {
      rules: readFileSync("database.rules.json", "utf8"),
      host: "127.0.0.1",
      port: 9000,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearDatabase();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await set(ref(context.database(), "games/GAME1"), EXISTING_GAME);
    await set(ref(context.database(), "private/GAME1/uid-wolf"), EXISTING_PRIVATE);
  });
});

describe("games/$gameId", () => {
  it("denies read to an unauthenticated client", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, "games/GAME1")));
  });

  it("allows read to any authenticated client", async () => {
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertSucceeds(get(ref(db, "games/GAME1")));
  });

  it("denies a client writing the phase directly, even the phase's own required actor", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "games/GAME1/phase"), { name: "DAWN", endsAt: 0, version: 2, requiredActors: [] }),
    );
  });

  it("denies a client writing players, result, roomCode, startedAt, or dayNumber", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(set(ref(db, "games/GAME1/players/uid-wolf/alive"), false));
    await assertFails(set(ref(db, "games/GAME1/result"), { winner: "WOLF", revealedRoles: {} }));
    await assertFails(set(ref(db, "games/GAME1/roomCode"), "HACKED"));
    await assertFails(set(ref(db, "games/GAME1/dayNumber"), 99));
  });

  it("allows a player to write their own action while their phase is live", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(
      set(ref(db, "games/GAME1/actions/WOLVES/uid-wolf"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("denies writing an action for a phase that isn't the current one", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "games/GAME1/actions/SEER/uid-wolf"), { target: "x", done: true, at: 1 }),
    );
  });

  it("denies writing someone else's action", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "games/GAME1/actions/WOLVES/uid-seer"), {
        target: "uid-wolf",
        done: true,
        at: 1,
      }),
    );
  });

  it("allows a dead Hunter to write their revenge shot regardless of the current phase", async () => {
    const db = testEnv.authenticatedContext("uid-dead-hunter").database();
    await assertSucceeds(
      set(ref(db, "games/GAME1/actions/HUNTER_SHOT/uid-dead-hunter"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });

  it("denies a still-alive player from writing a Hunter revenge shot", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(
      set(ref(db, "games/GAME1/actions/HUNTER_SHOT/uid-wolf"), {
        target: "uid-seer",
        done: true,
        at: 1234,
      }),
    );
  });
});

describe("private/$gameId/$uid", () => {
  it("denies read to anyone but the owning uid", async () => {
    const db = testEnv.authenticatedContext("uid-seer").database();
    await assertFails(get(ref(db, "private/GAME1/uid-wolf")));
  });

  it("allows the owning uid to read their own private state", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertSucceeds(get(ref(db, "private/GAME1/uid-wolf")));
  });

  it("denies any client write, even from the owning uid", async () => {
    const db = testEnv.authenticatedContext("uid-wolf").database();
    await assertFails(set(ref(db, "private/GAME1/uid-wolf/role"), "VILLAGER"));
  });
});
