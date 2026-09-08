import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { connectDatabaseEmulator, getDatabase, ref, get } from "firebase/database";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { roomPath } from "./paths";
import { ALL_ROLE_KEYS, type RoleKey } from "@/types/game";

let app: FirebaseApp;

function zeroDeck(): Record<RoleKey, number> {
  return Object.fromEntries(ALL_ROLE_KEYS.map((key) => [key, 0])) as Record<RoleKey, number>;
}

function deck(overrides: Partial<Record<RoleKey, number>>): Record<RoleKey, number> {
  return { ...zeroDeck(), ...overrides };
}

const VALID_DECK = deck({ WEREWOLF: 2, SEER: 1, WITCH: 1, VILLAGER: 4 });

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
  it("creates a room with the given owner as its first member, dealing exactly the given deck", async () => {
    const db = getDatabase(app);
    const { user } = await signInAnonymously(getAuth(app));
    const code = await createRoom(db, {
      uid: user.uid,
      name: "Anh",
      photoURL: null,
      roleCounts: VALID_DECK,
    });

    expect(code).toHaveLength(6);
    const snapshot = await get(ref(db, roomPath(code)));
    const room = snapshot.val();
    expect(room.status).toBe("LOBBY");
    expect(room.settings.roleCounts).toEqual(VALID_DECK);
    expect(room.members[user.uid].name).toBe("Anh");
  });

  it("rejects a deck totaling below 4", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, {
        uid: "uid-2",
        name: "B",
        photoURL: null,
        roleCounts: deck({ WEREWOLF: 1, VILLAGER: 1 }),
      }),
    ).rejects.toThrow(/ít nhất 4/);
  });

  it("rejects a deck totaling above 16", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, {
        uid: "uid-3",
        name: "C",
        photoURL: null,
        roleCounts: deck({ WEREWOLF: 10, VILLAGER: 10 }),
      }),
    ).rejects.toThrow(/Tối đa 16/);
  });

  it("rejects a deck with zero Wolf-faction roles", async () => {
    const db = getDatabase(app);
    await expect(
      createRoom(db, {
        uid: "uid-4",
        name: "D",
        photoURL: null,
        roleCounts: deck({ SEER: 1, WITCH: 1, VILLAGER: 6 }),
      }),
    ).rejects.toThrow(/phe Sói/);
  });
});
