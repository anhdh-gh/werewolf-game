"use client";

import { useRouter } from "next/navigation";
import type { Game } from "@/types/game";
import { FACTION_LABELS } from "@/lib/game/labels";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** No role reveal here, on purpose — not even at game end. Roles are never
 * sent to a client that doesn't own them, full stop (spec §12's "đừng gửi"
 * principle, applied without the usual end-of-game exception). Only the
 * winning faction and who survived (already public all game) are shown. */
export function GameEndScreen({ game }: { game: Game }) {
  const router = useRouter();
  if (!game.result) return null;

  const players = Object.entries(game.players);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <Logo size={56} />
        <h1 className="font-heading text-2xl tracking-wide">
          {FACTION_LABELS[game.result.winner]} thắng!
        </h1>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Ai còn sống</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {players.map(([uid, player]) => (
                <li
                  key={uid}
                  className={cn(
                    "flex items-center justify-between text-sm",
                    !player.alive && "text-muted-foreground line-through",
                  )}
                >
                  <span>{player.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {player.alive ? "sống sót" : "đã chết"}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Button className="h-12 w-full text-base" onClick={() => router.push(`/room/${game.roomCode}`)}>
          Về sảnh
        </Button>
      </div>
    </main>
  );
}
