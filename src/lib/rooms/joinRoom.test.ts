import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDatabase, connectDatabaseEmulator, ref, get } from "firebase/database";
import { connectAuthEmulator, getAuth, signInAnonymously, signOut } from "firebase/auth";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { joinRoom, JoinRoomError } from "./joinRoom";
import { roomPath } from "./paths";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp(
    {
      apiKey: "test-api-key",
      projectId: "werewolf-rules-test",
      databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test",
    },
    "join-room-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });
});

afterAll(async () => {
  await deleteApp(app);
});

async function signInAs(): Promise<string> {
  // signInAnonymously() returns the CURRENT anonymous user if one is
  // already signed in on this Auth instance (documented Firebase Auth
  // behavior) rather than creating a fresh identity — confirmed empirically
  // against the real Auth emulator. signOut() first (safe even when nobody
  // is signed in yet) is what actually makes each call mint a new,
  // distinct uid, which is what "switching identity" requires here.
  await signOut(getAuth(app));
  const { user } = await signInAnonymously(getAuth(app));
  return user.uid;
}

describe("joinRoom", () => {
  it("adds the joiner as a member", async () => {
    const db = getDatabase(app);
    const ownerUid = await signInAs();
    const code = await createRoom(db, {
      uid: ownerUid,
      name: "Owner",
      photoURL: null,
      maxPlayers: 4,
    });

    const joinerUid = await signInAs();
    await joinRoom(db, code, { uid: joinerUid, name: "Joiner", photoURL: null });

    const snapshot = await get(ref(db, roomPath(code)));
    expect(snapshot.val().members[joinerUid].name).toBe("Joiner");
  });

  it("throws NOT_FOUND for a code that does not exist", async () => {
    const db = getDatabase(app);
    const uid = await signInAs();
    await expect(
      joinRoom(db, "NOPE00", { uid, name: "X", photoURL: null }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("throws FULL when the room is at maxPlayers", async () => {
    // maxPlayers has a floor of 4 (createRoom validates it, and the deployed
    // rules' settings.validate enforces the same bound), so this fills a
    // 4-player room via three real joinRoom calls rather than creating a
    // room already at capacity.
    const db = getDatabase(app);
    const ownerUid = await signInAs();
    const code = await createRoom(db, {
      uid: ownerUid,
      name: "Owner",
      photoURL: null,
      maxPlayers: 4,
    });

    const aUid = await signInAs();
    await joinRoom(db, code, { uid: aUid, name: "A", photoURL: null });
    const bUid = await signInAs();
    await joinRoom(db, code, { uid: bUid, name: "B", photoURL: null });
    const cUid = await signInAs();
    await joinRoom(db, code, { uid: cUid, name: "C", photoURL: null });

    const extraUid = await signInAs();
    let caught: unknown;
    try {
      await joinRoom(db, code, { uid: extraUid, name: "X", photoURL: null });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(JoinRoomError);
    expect((caught as JoinRoomError).code).toBe("FULL");
  });

  it("is idempotent for a member re-joining their own room", async () => {
    const db = getDatabase(app);
    const ownerUid = await signInAs();
    const code = await createRoom(db, {
      uid: ownerUid,
      name: "Owner",
      photoURL: null,
      maxPlayers: 4,
    });

    await expect(
      joinRoom(db, code, { uid: ownerUid, name: "Owner", photoURL: null }),
    ).resolves.toBeUndefined();
  });
});
