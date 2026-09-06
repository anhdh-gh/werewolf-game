import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectDatabaseEmulator, getDatabase, ref, get } from "firebase/database";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { roomPath } from "./paths";

let app: FirebaseApp;

beforeAll(() => {
  app = initializeApp({
    apiKey: "test-api-key",
    projectId: "werewolf-rules-test",
    databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test",
  });
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });
});

afterAll(async () => {
  await deleteApp(app);
});

describe("createRoom", () => {
  it("creates a room with the given owner as its first member", async () => {
    const db = getDatabase(app);
    const { user } = await signInAnonymously(getAuth(app));
    const code = await createRoom(db, {
      uid: user.uid,
      name: "Anh",
      photoURL: null,
      maxPlayers: 8,
    });

    expect(code).toHaveLength(6);
    const snapshot = await get(ref(db, roomPath(code)));
    const room = snapshot.val();
    expect(room.status).toBe("LOBBY");
    expect(room.settings.maxPlayers).toBe(8);
    expect(room.members[user.uid].name).toBe("Anh");
  });

  it("rejects maxPlayers below 4", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, { uid: "uid-2", name: "B", photoURL: null, maxPlayers: 2 }),
    ).rejects.toThrow(/4 đến 16/);
  });

  it("rejects maxPlayers above 16", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, { uid: "uid-3", name: "C", photoURL: null, maxPlayers: 20 }),
    ).rejects.toThrow(/4 đến 16/);
  });
});
