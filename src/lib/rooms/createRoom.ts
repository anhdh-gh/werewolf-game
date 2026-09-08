import { type Database, ref, runTransaction, update } from "firebase/database";
import { generateRoomCode } from "./roomCode";
import { roomPath, roomStatusPath, roomMemberPath } from "./paths";
import { assertValidDeck } from "@/lib/game/roles";
import type { RoleKey } from "@/types/game";

const MAX_ATTEMPTS = 5;

export interface CreateRoomInput {
  uid: string;
  name: string;
  photoURL: string | null;
  /** Deck-builder change (2026-09-08): the caller (room-creation UI) builds
   * the exact deck up front — createRoom no longer computes one from a
   * player-count formula. */
  roleCounts: Record<RoleKey, number>;
}

export async function createRoom(db: Database, input: CreateRoomInput): Promise<string> {
  assertValidDeck(input.roleCounts);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    const created = await tryCreateAt(db, code, input);
    if (created) return code;
  }
  throw new Error("Không tạo được mã phòng, thử lại");
}

async function tryCreateAt(
  db: Database,
  code: string,
  input: CreateRoomInput,
): Promise<boolean> {
  // RTDB checks a set()/transaction's write permission by walking from its
  // exact target path up to root only — it never separately consults a
  // descendant leaf's own .write rule for a single nested write (see
  // database.rules.json and Task 6's rules tests). So the collision claim
  // must transact on ONE leaf that already carries its own
  // "!data.exists()" rule — status — not on the whole room object.
  const claim = await runTransaction(ref(db, roomStatusPath(code)), (current) => {
    if (current !== null) return undefined;
    return "LOBBY";
  });
  if (!claim.committed) return false;

  const now = Date.now();

  // A multi-path update() evaluates each key independently against its own
  // leaf rule, unlike set() — this is what lets the rest of the room get
  // written once the code is claimed.
  await update(ref(db), {
    [`${roomPath(code)}/createdAt`]: now,
    [`${roomPath(code)}/settings`]: {
      roleCounts: input.roleCounts,
      remoteMode: false,
    },
    [roomMemberPath(code, input.uid)]: {
      name: input.name,
      photoURL: input.photoURL,
      joinedAt: now,
      ready: false,
      online: true,
    },
  });

  return true;
}
