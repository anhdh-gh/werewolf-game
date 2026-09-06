import {
  type Database,
  ref,
  onValue,
  onDisconnect,
  set,
  update,
  serverTimestamp,
} from "firebase/database";
import { presencePath, roomMemberPath } from "../rooms/paths";

export function attachPresence(db: Database, uid: string, roomCode: string): () => void {
  const connectedRef = ref(db, ".info/connected");
  const presenceRef = ref(db, presencePath(uid));
  const memberOnlineRef = ref(db, `${roomMemberPath(roomCode, uid)}/online`);

  const unsubscribe = onValue(connectedRef, (snapshot) => {
    if (snapshot.val() !== true) return;

    onDisconnect(presenceRef).set({
      online: false,
      lastSeen: serverTimestamp(),
      roomCode,
    });
    onDisconnect(memberOnlineRef).set(false);

    set(presenceRef, { online: true, lastSeen: serverTimestamp(), roomCode });
    set(memberOnlineRef, true);
  });

  return unsubscribe;
}

export async function detachPresence(
  db: Database,
  uid: string,
  roomCode: string,
): Promise<void> {
  await update(ref(db), {
    [presencePath(uid)]: { online: false, lastSeen: serverTimestamp(), roomCode: null },
    [`${roomMemberPath(roomCode, uid)}/online`]: false,
  });
}
