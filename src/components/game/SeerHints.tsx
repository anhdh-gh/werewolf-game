"use client";

import type { Game, PrivatePlayerState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** The Seer's own check history — written by the server into her private
 * state (advance route, "Leaving SEER"). Nothing here is visible to anyone
 * but the Seer herself; privateState is never passed to another player's
 * screen. */
export function SeerHints({
  privateState,
  players,
}: {
  privateState: PrivatePlayerState | null;
  players: Game["players"];
}) {
  if (privateState?.role !== "SEER" || !privateState.hints) return null;

  const hints = Object.values(privateState.hints).sort((a, b) => a.dayNumber - b.dayNumber);
  if (hints.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bạn đã soi</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {hints.map((hint, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span>
                Ngày {hint.dayNumber} — {players[hint.targetUid]?.name ?? "?"}
              </span>
              <span
                className={
                  hint.result === "WOLF" ? "font-medium text-destructive" : "text-muted-foreground"
                }
              >
                {hint.result === "WOLF" ? "là sói" : "là dân"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
