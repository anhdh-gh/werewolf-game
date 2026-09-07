"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import type { PrivatePlayerState } from "@/types/game";
import { privatePlayerPath } from "./paths";

export function usePrivateState(
  db: Database,
  gameId: string,
  uid: string | undefined,
): { privateState: PrivatePlayerState | null; loading: boolean } {
  const [privateState, setPrivateState] = useState<PrivatePlayerState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = onValue(ref(db, privatePlayerPath(gameId, uid)), (snapshot) => {
      setPrivateState(snapshot.val());
      setLoading(false);
    });
    return unsubscribe;
  }, [db, gameId, uid]);

  return { privateState, loading };
}
