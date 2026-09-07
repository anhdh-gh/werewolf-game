"use client";

import { cn } from "@/lib/utils";
import type { GamePlayer } from "@/types/game";

export function PlayerList({
  players,
  meUid,
}: {
  players: Record<string, GamePlayer>;
  meUid: string;
}) {
  const entries = Object.entries(players);

  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map(([uid, player]) => (
        <li
          key={uid}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-opacity",
            !player.alive && "opacity-40 line-through",
          )}
        >
          <span className="flex-1 truncate">
            {player.name}
            {uid === meUid && <span className="ml-1.5 text-xs text-muted-foreground">(bạn)</span>}
          </span>
          {player.muted && player.alive && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              câm
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
