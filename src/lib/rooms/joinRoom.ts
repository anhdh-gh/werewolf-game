import { type Database, ref, get, set } from "firebase/database";
import type { Room } from "@/types/room";
import { roomPath, roomMemberPath } from "./paths";

export class JoinRoomError extends Error {
  code: "NOT_FOUND" | "FULL" | "ALREADY_PLAYING";

  constructor(code: "NOT_FOUND" | "FULL" | "ALREADY_PLAYING", message: string) {
    super(message);
    this.code = code;
  }
}

export interface JoinRoomInput {
  uid: string;
  name: string;
  photoURL: string | null;
}

export async function joinRoom(
  db: Database,
  roomCode: string,
  input: JoinRoomInput,
): Promise<void> {
  const snapshot = await get(ref(db, roomPath(roomCode)));
  const room = snapshot.val() as Room | null;

  if (room === null) {
    throw new JoinRoomError("NOT_FOUND", `Phòng ${roomCode} không tồn tại`);
  }
  if (room.status === "PLAYING") {
    throw new JoinRoomError("ALREADY_PLAYING", "Phòng đang chơi, không vào được");
  }
  if (!room.settings || !room.members) {
    throw new JoinRoomError("NOT_FOUND", `Phòng ${roomCode} không tồn tại`);
  }

  const alreadyMember = Boolean(room.members?.[input.uid]);
  if (alreadyMember) return;

  const memberCount = Object.keys(room.members ?? {}).length;
  if (memberCount >= room.settings.maxPlayers) {
    throw new JoinRoomError("FULL", "Phòng đã đầy");
  }

  // A single set() at the member's own leaf matches that leaf's own
  // .write rule directly (auth.uid === $uid) — the same reason createRoom
  // writes leaf-by-leaf instead of the whole room at once (see Task 6).
  // This leaves a small race window: two people joining the last open
  // slot at the same instant could both pass the FULL check above before
  // either write lands, so the room could briefly hold one more member
  // than maxPlayers. Accepted for v1 — this is a friend-group party game
  // with no adversarial concurrency, not a security boundary, and the
  // room self-corrects on the next read.
  await set(ref(db, roomMemberPath(roomCode, input.uid)), {
    name: input.name,
    photoURL: input.photoURL,
    joinedAt: Date.now(),
    ready: false,
    online: true,
  });
}
