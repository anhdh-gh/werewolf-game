"use client";

import type { Game, PrivatePlayerState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Story 1.1 (Mason/Hội Kín): passive knowledge written once at role-dealing
 * time (masonUids on PrivatePlayerState), same standing-display pattern as
 * PackInfo — no phase, no ActionPanel involved. Shown even when this uid is
 * the game's only Mason, so they don't mistake silence for a bug. */
export function MasonInfo({
  privateState,
  players,
}: {
  privateState: PrivatePlayerState | null;
  players: Game["players"];
}) {
  if (privateState?.role !== "MASON") return null;

  const names = (privateState.masonUids ?? [])
    .map((uid) => players[uid]?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hội Kín</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {names.length > 0
            ? `Đồng minh Hội Kín của bạn: ${names.join(", ")}`
            : "Bạn là Hội Kín duy nhất ván này."}
        </p>
      </CardContent>
    </Card>
  );
}
