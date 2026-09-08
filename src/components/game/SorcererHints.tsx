"use client";

import type { Game, PrivatePlayerState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** The Sorcerer's own check history — written by the server into their
 * private state (advance route, "Leaving SORCERER"). Same shape as
 * SeerHints, distinct because the result here is boolean ("is the Seer?"),
 * not "WOLF"|"VILLAGER". Nothing here is visible to anyone but the Sorcerer
 * themself; privateState is never passed to another player's screen. */
export function SorcererHints({
  privateState,
  players,
}: {
  privateState: PrivatePlayerState | null;
  players: Game["players"];
}) {
  if (privateState?.role !== "SORCERER" || !privateState.sorcererHints) return null;

  const hints = Object.values(privateState.sorcererHints).sort(
    (a, b) => a.dayNumber - b.dayNumber,
  );
  if (hints.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bạn đã dò</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {hints.map((hint, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span>
                Ngày {hint.dayNumber} — {players[hint.targetUid]?.name ?? "?"}
              </span>
              <span
                className={hint.result ? "font-medium text-destructive" : "text-muted-foreground"}
              >
                {hint.result ? "đúng, là Tiên Tri" : "không phải Tiên Tri"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
