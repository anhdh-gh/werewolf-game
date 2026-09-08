import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import { initializeApp, deleteApp, type FirebaseApp } from "firebase/app";
import { createRoom } from "./createRoom";
import { useRoom } from "./useRoom";
import { ALL_ROLE_KEYS, type RoleKey } from "@/types/game";

let app: FirebaseApp;

function zeroDeck(): Record<RoleKey, number> {
  return Object.fromEntries(ALL_ROLE_KEYS.map((key) => [key, 0])) as Record<RoleKey, number>;
}

const DECK_OF_8 = { ...zeroDeck(), WEREWOLF: 2, SEER: 1, WITCH: 1, VILLAGER: 4 };

beforeAll(() => {
  app = initializeApp(
    {
      apiKey: "test-api-key",
      projectId: "werewolf-rules-test",
      databaseURL: "http://127.0.0.1:9000/?ns=werewolf-rules-test",
    },
    "use-room-tests",
  );
  connectDatabaseEmulator(getDatabase(app), "127.0.0.1", 9000);
  connectAuthEmulator(getAuth(app), "http://127.0.0.1:9099", { disableWarnings: true });
});

afterAll(async () => {
  await deleteApp(app);
});

describe("useRoom", () => {
  it("loads the room and reflects live updates", async () => {
    const db = getDatabase(app);
    const { user } = await signInAnonymously(getAuth(app));
    const code = await createRoom(db, {
      uid: user.uid,
      name: "Anh",
      photoURL: null,
      roleCounts: DECK_OF_8,
    });

    const { result } = renderHook(() => useRoom(db, code));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.room?.members[user.uid].name).toBe("Anh");
  });

  it("returns a null room for a code that does not exist", async () => {
    const db = getDatabase(app);
    await signInAnonymously(getAuth(app));
    const { result } = renderHook(() => useRoom(db, "NOPE99"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.room).toBeNull();
  });
});
