import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  get,
  set,
  goOffline,
  goOnline,
} from "firebase/database";
import { connectAuthEmulator, getAuth, signInAnonymously, signOut } from "firebase/auth";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { attachPresence, detachPresence } from "./presence";
import { presencePath, roomMemberPath } from "../rooms/paths";

let app: FirebaseApp;
// A second, independently-authenticated app/connection used only to *read* presence data
// from outside the goOffline()/goOnline() dance below. `attachPresence` re-subscribes to
// `.info/connected` on every reconnect of `app`'s own Database instance, so toggling that
// same instance's connection to observe the onDisconnect-written value races the app's own
// reconnect handler (which reliably wins, since it reacts to the same event with no
// read round-trip). presence rules only require `auth != null` to read (not a matching uid),
// so a separately-authenticated, always-connected reader avoids that self-defeating race.
let readerApp: FirebaseApp;

beforeAll(async () => {
  app = initializeApp(
    {
      apiKey: "test-api-key",
      projectId: "werewolf-rules-test",
      databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test",
    },
    "presence-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });

  readerApp = initializeApp(
    {
      apiKey: "test-api-key",
      projectId: "werewolf-rules-test",
      databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test",
    },
    "presence-tests-reader",
  );
  connectDatabaseEmulator(getDatabase(readerApp), "127.0.0.1", 9000);
  connectAuthEmulator(getAuth(readerApp), "http://127.0.0.1:9099", { disableWarnings: true });
  await signInAnonymously(getAuth(readerApp));
});

afterAll(async () => {
  await deleteApp(app);
  await deleteApp(readerApp);
});

async function signInAs(): Promise<string> {
  await signOut(getAuth(app));
  const { user } = await signInAnonymously(getAuth(app));
  return user.uid;
}

describe("attachPresence", () => {
  it(
    "marks the user online and sets up an onDisconnect handler that flips it offline",
    async () => {
      const db = getDatabase(app);
      const uid = await signInAs();
      await set(ref(db, roomMemberPath("ROOM01", uid)), {
        name: "Anh",
        photoURL: null,
        joinedAt: 1,
        ready: false,
        online: false,
      });

      const detach = attachPresence(db, uid, "ROOM01");
      await vi.waitFor(async () => {
        const snap = await get(ref(db, presencePath(uid)));
        expect(snap.val()?.online).toBe(true);
      });

      goOffline(db);
      const readerDb = getDatabase(readerApp);
      await vi.waitFor(
        async () => {
          const snap = await get(ref(readerDb, presencePath(uid)));
          expect(snap.val()?.online).toBe(false);
        },
        { timeout: 10000 },
      );
      goOnline(db);
      detach();
    },
    15000,
  );
});

describe("detachPresence", () => {
  it("explicitly marks the user offline", async () => {
    const db = getDatabase(app);
    const uid = await signInAs();
    // detachPresence only ever updates the `online` leaf of an existing member
    // (see RoomLobby.tsx's leave(), which removes the member outright instead
    // for an actual departure). The member must already exist with the rest of
    // its required fields, or the new closed schema on members/$uid correctly
    // rejects the bare {online: false} update — the same protection that
    // closes the C2 phantom-member exploit.
    await set(ref(db, roomMemberPath("ROOM02", uid)), {
      name: "Anh",
      photoURL: null,
      joinedAt: 1,
      ready: false,
      online: true,
    });
    await detachPresence(db, uid, "ROOM02");
    const snap = await get(ref(db, presencePath(uid)));
    expect(snap.val()?.online).toBe(false);
    // RTDB never persists an explicit `null` leaf: a null-valued field in a set()/update()
    // payload deletes that key instead of storing it (verified directly against the emulator:
    // PUT {"a":1,"b":null} reads back as {"a":1}). So a cleared roomCode is observed as an
    // absent key, i.e. `undefined` on the plain object from `.val()`, never `null`.
    expect(snap.val()?.roomCode).toBeUndefined();
  });
});
