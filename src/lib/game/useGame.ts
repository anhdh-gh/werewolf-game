"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import type { Game } from "@/types/game";
import { gamePath } from "./paths";

export function useGame(db: Database, gameId: string): { game: Game | null; loading: boolean } {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, gamePath(gameId)), (snapshot) => {
      setGame(snapshot.val());
      setLoading(false);
    });
    return unsubscribe;
  }, [db, gameId]);

  return { game, loading };
}
