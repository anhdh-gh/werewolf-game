import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { ref, set, get, update } from "firebase/database";

let testEnv: RulesTestEnvironment;

const EXISTING_ROOM = {
  createdAt: 1000,
  status: "LOBBY",
  settings: { maxPlayers: 8, rolesEnabled: { BODYGUARD: true, TRAITOR: true, HUNTER: true, CUPID: true, MUTER: true, CURSED: true, LYCAN: true, TANNER: true } },
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

  // RTDB evaluates a set()/transaction's write permission by walking from its
  // exact target path up to root only — it never separately consults a
  // descendant leaf's own .write rule for a single nested write. A room can
  // therefore never be created with one set()/transaction at rooms/$code,
  // no matter what the leaf rules below it allow. This test documents that
  // constraint so it isn't mistaken for a bug later.
  it("denies a single nested set() at the room root, even with fully valid data", async () => {
    const db = testEnv.authenticatedContext("uid-solo2").database();
    await assertFails(
      set(ref(db, "rooms/SOLO02"), {
        createdAt: 5000,
        status: "LOBBY",
        settings: {
          maxPlayers: 8,
          rolesEnabled: { BODYGUARD: true, TRAITOR: true, HUNTER: true, CUPID: true, MUTER: true, CURSED: true, LYCAN: true, TANNER: true },
        },
        members: {
          "uid-solo2": {
            name: "Solo2",
            photoURL: null,
            joinedAt: 5000,
            ready: false,
            online: true,
          },
        },
      }),
    );
  });

  // This is the pattern createRoom (Task 8) actually uses: claim the code by
  // transacting on the status leaf alone (it already carries its own
  // "!data.exists()" rule), then fill in the rest with a multi-path
  // update() — each key of an update() is evaluated independently against
  // its own leaf rule, unlike a single set(). The settings rule's
  // newData.parent() sees the room's state as it resolves at the end of
  // this update(), including the members key written in the same call.
  it("allows the two-step creation pattern: claim the status leaf, then multi-path update", async () => {
    const db = testEnv.authenticatedContext("uid-solo").database();

    await assertSucceeds(set(ref(db, "rooms/SOLO01/status"), "LOBBY"));

    await assertSucceeds(
      update(ref(db), {
        "rooms/SOLO01/createdAt": 5000,
        "rooms/SOLO01/settings": {
          maxPlayers: 8,
          rolesEnabled: { BODYGUARD: true, TRAITOR: true, HUNTER: true, CUPID: true, MUTER: true, CURSED: true, LYCAN: true, TANNER: true },
        },
        "rooms/SOLO01/members/uid-solo": {
          name: "Solo",
          photoURL: null,
          joinedAt: 5000,
          ready: false,
          online: true,
        },
      }),
    );
  });

  it("denies writing settings into a room the writer is not a member of", async () => {
    const db = testEnv.authenticatedContext("uid-ghost").database();
    await assertFails(
      set(ref(db, "rooms/GHOST1/settings"), { maxPlayers: 8, rolesEnabled: {} }),
    );
  });

  // Writing null is a delete in RTDB, and .validate never runs on deletes —
  // only .write governs whether a deletion is permitted. This is denied by
  // the settings rule's newData.exists() guard, not by .validate: settings
  // must never disappear from a room, matching Room.settings being a
  // required (non-optional) field in src/types/room.ts.
  it("denies deleting settings entirely", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings"), null));
  });

  // This one exercises .validate directly: a non-deleting payload (has
  // children) that is still the wrong shape.
  it("denies a settings write missing rolesEnabled", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings"), { maxPlayers: 8 }));
  });

  it("denies a settings write with maxPlayers out of range", async () => {
    const db = testEnv.authenticatedContext("uid-owner").database();
    await assertFails(set(ref(db, "rooms/EXIST1/settings/maxPlayers"), 99));
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
