"use client";

import type { Game, PrivatePlayerState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Story 4a.2 (Beholder/"Kẻ Quan Sát"): passive knowledge written once at
 * role-dealing time (beholderSeerUid on PrivatePlayerState), same
 * standing-display pattern as MasonInfo — no phase, no ActionPanel
 * involved. */
export function BeholderInfo({
  privateState,
  players,
}: {
  privateState: PrivatePlayerState | null;
  players: Game["players"];
}) {
  if (privateState?.role !== "BEHOLDER") return null;

  const seerName = privateState.beholderSeerUid ? players[privateState.beholderSeerUid]?.name : undefined;
  if (!seerName) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kẻ Quan Sát</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Tiên Tri ván này là: {seerName}</p>
      </CardContent>
    </Card>
  );
}
