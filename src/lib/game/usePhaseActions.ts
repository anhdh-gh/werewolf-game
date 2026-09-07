"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import { gameActionsPath } from "./paths";
import { tallyMajorityVote } from "./resolveNight";

/** Raw actions for one phaseKey — actions are readable by any authenticated
 * client (only writes are locked to their own uid), which is exactly what
 * lets the Witch see the wolves' pick directly (spec §4.1) without any
 * server round-trip. */
export function usePhaseActions(
  db: Database,
  gameId: string,
  phaseKey: string,
): Record<string, { target: string; done: boolean; at: number }> {
  const [actions, setActions] = useState<Record<string, { target: string; done: boolean; at: number }>>(
    {},
  );

  useEffect(() => {
    const unsubscribe = onValue(ref(db, gameActionsPath(gameId, phaseKey)), (snapshot) => {
      setActions(snapshot.val() ?? {});
    });
    return unsubscribe;
  }, [db, gameId, phaseKey]);

  return actions;
}

/** The wolf pack's current majority pick, live — for the Witch's screen. */
export function useWolfTarget(db: Database, gameId: string): string | null {
  const wolfActions = usePhaseActions(db, gameId, "WOLVES");
  const votes = Object.fromEntries(
    Object.entries(wolfActions).map(([uid, action]) => [uid, action.target]),
  );
  return tallyMajorityVote(votes);
}
