"use client";

import { useRouter } from "next/navigation";
import type { Game } from "@/types/game";
import { ROLE_LABELS, FACTION_LABELS } from "@/lib/game/labels";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GameEndScreen({ game }: { game: Game }) {
  const router = useRouter();
  if (!game.result) return null;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <Logo size={56} />
        <h1 className="font-heading text-2xl tracking-wide">
          {FACTION_LABELS[game.result.winner]} thắng!
        </h1>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Vai trò mọi người</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1.5">
              {Object.entries(game.result.revealedRoles).map(([uid, role]) => (
                <li key={uid} className="flex justify-between text-sm">
                  <span>{game.players[uid]?.name ?? uid}</span>
                  <span className="text-muted-foreground">{ROLE_LABELS[role]}</span>
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
