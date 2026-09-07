"use client";

import type { Game, PrivatePlayerState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Spec §4.1: "Kẻ Phản Bội biết hết đồng bọn sói" — every wolf-faction
 * player (Werewolf or Traitor) knows the rest of the pack. This is passive
 * knowledge, not something to gate behind the WOLVES phase's ActionPanel —
 * the Traitor never wakes for WOLVES at all (spec: "không thức đêm, không
 * tham gia cắn"), so without a standing display like this one, they'd
 * never learn who their allies are for the whole game. */
export function PackInfo({
  privateState,
  players,
}: {
  privateState: PrivatePlayerState | null;
  players: Game["players"];
}) {
  const packUids = privateState?.packUids;
  if (!packUids || packUids.length === 0) return null;

  const names = packUids.map((uid) => players[uid]?.name).filter(Boolean);
  if (names.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đồng bọn của bạn</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{names.join(", ")}</p>
      </CardContent>
    </Card>
  );
}
