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

const EXISTING_ROOM = {
  createdAt: 1000,
  status: "LOBBY",
  settings: { maxPlayers: 8, rolesEnabled: { BODYGUARD: true, CURSED: true, MUTER: true, TANNER: true } },
  members: {
    "uid-owner": { name: "Owner", photoURL: null, joinedAt: 1000, ready: false, online: true },
  },
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
    await set(ref(context.database(), "rooms/EXIST1"), EXISTING_ROOM);
  });
});

describe("rooms/$code", () => {
  it("denies read to an unauthenticated client", async () => {
    const db = testEnv.unauthenticatedContext().database();
    await assertFails(get(ref(db, "rooms/EXIST1")));
  });

  it("allows read to any authenticated client", async () => {
    const db = testEnv.authenticatedContext("uid-other").database();
    await assertSucceeds(get(ref(db, "rooms/EXIST1")));
  });

  it("allows creating a brand new room's status/createdAt/member together", async () => {
    const db = testEnv.authenticatedContext("uid-new").database();
    await assertSucceeds(
      Promise.all([
        set(ref(db, "rooms/NEWROOM/status"), "LOBBY"),
        set(ref(db, "rooms/NEWROOM/createdAt"), 2000),
        set(ref(db, "rooms/NEWROOM/members/uid-new"), {
          name: "New",
          photoURL: null,
          joinedAt: 2000,
          ready: false,
          online: true,
        }),
      ]),
    );
  });

  it("denies overwriting an existing room's status", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/status"), "PLAYING"));
  });

  it("allows a member to write their own member node", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(
      set(ref(db, "rooms/EXIST1/members/uid-owner/ready"), true),
    );
  });

  it("denies writing someone else's member node", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(
      set(ref(db, "rooms/EXIST1/members/uid-someone-else"), {
        name: "Intruder",
        photoURL: null,
        joinedAt: 3000,
        ready: false,
        online: true,
      }),
    );
  });

  it("allows an existing member to update settings while in LOBBY", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 10));
  });

  it("denies a non-member from updating settings", async () => {
    const db = testEnv.authenticatedContext("uid-outsider").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 10));
  });

  it("denies any client from writing currentGameId", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/currentGameId"), "game-1"));
  });
});

describe("presence/$uid", () => {
  it("allows a user to write their own presence", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertSucceeds(
      set(ref(db, "presence/uid-owner"), { online: true, lastSeen: 1000, roomCode: "EXIST1" }),
    );
  });

  it("denies writing someone else's presence", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(
      set(ref(db, "presence/uid-someone-else"), { online: true, lastSeen: 1000, roomCode: null }),
    );
  });
});
