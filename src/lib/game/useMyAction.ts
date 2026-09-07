"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import { gameActionPath } from "./paths";

export interface ActionRecord {
  target: string | null;
  done: boolean;
  at: number;
}

/** Whether — and what — the current user already submitted for a given
 * phaseKey, so the UI can show "đang chờ những người khác" instead of
 * re-prompting for input after a page refresh or reconnect. */
export function useMyAction(
  db: Database,
  gameId: string,
  phaseKey: string,
  uid: string | undefined,
): ActionRecord | null {
  const [action, setAction] = useState<ActionRecord | null>(null);

  useEffect(() => {
    if (!uid || !phaseKey) {
      setAction(null);
      return;
    }
    const unsubscribe = onValue(ref(db, gameActionPath(gameId, phaseKey, uid)), (snapshot) => {
      setAction(snapshot.val());
    });
    return unsubscribe;
  }, [db, gameId, phaseKey, uid]);

  return action;
}
