"use client";

import { useEffect, useState } from "react";
import { type Database, ref, onValue } from "firebase/database";
import type { Room } from "@/types/room";
import { roomPath } from "./paths";

export function useRoom(db: Database, code: string): { room: Room | null; loading: boolean } {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onValue(ref(db, roomPath(code)), (snapshot) => {
      setRoom(snapshot.val());
      setLoading(false);
    });
    return unsubscribe;
  }, [db, code]);

  return { room, loading };
}
