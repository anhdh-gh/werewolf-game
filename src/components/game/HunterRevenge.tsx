"use client";

import { useState } from "react";
import { type Database } from "firebase/database";
import type { Game } from "@/types/game";
import { useMyAction } from "@/lib/game/useMyAction";
import { submitAction } from "@/lib/game/actions";
import { TargetPicker } from "./TargetPicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Spec §4.4 step 8: a dead Hunter shoots someone on the way out. Not tied
 * to any phase — this renders as soon as this uid is dead, a Hunter, and
 * hasn't shot yet, regardless of what phase the rest of the table is in. */
export function HunterRevengePrompt({
  db,
  gameId,
  uid,
  game,
}: {
  db: Database;
  gameId: string;
  uid: string;
  game: Game;
}) {
  const [selected, setSelected] = useState<string | null | undefined>(undefined);
  const myShot = useMyAction(db, gameId, "HUNTER_SHOT", uid);

  if (myShot?.done) return null;

  const targets = Object.entries(game.players)
    .filter(([targetUid, p]) => targetUid !== uid && p.alive)
    .map(([targetUid, p]) => ({ uid: targetUid, name: p.name }));

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle>Bạn đã chết — bắn trả thù ai?</CardTitle>
      </CardHeader>
      <CardContent>
        <TargetPicker
          targets={targets}
          selected={selected}
          onSelect={setSelected}
          onSubmit={() => submitAction(db, gameId, "HUNTER_SHOT", uid, selected ?? null)}
          submitLabel="Bắn"
          abstainLabel="Không bắn ai"
        />
      </CardContent>
    </Card>
  );
}
