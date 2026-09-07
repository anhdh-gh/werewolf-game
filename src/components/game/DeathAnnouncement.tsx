"use client";

import type { Game } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** Spec §4.3: DAWN's job is "công bố người chết" (announce the night's
 * dead) and VOTE_RESULT's is the hang outcome — both already visible
 * implicitly once players/{uid}/alive flips (PlayerList greys the name
 * out), but a clear banner beats expecting anyone to notice that by
 * diffing the list against memory. Only rendered during the narrow window
 * right after `game.lastDeaths` was actually written for that event
 * (advance/route.ts writes it exactly once per resolution) — outside that
 * window it would just be showing stale, out-of-context data. */
export function DeathAnnouncement({ game }: { game: Game }) {
  const phase = game.phase.name;
  const isNightWindow = phase === "DAWN" || phase === "DISCUSSION";
  const isVoteWindow = phase === "VOTE_RESULT";
  if (!isNightWindow && !isVoteWindow) return null;
  if (!game.lastDeaths) return null;

  const names = game.lastDeaths.map((uid) => game.players[uid]?.name).filter(Boolean);

  const title = isNightWindow ? "Đêm qua" : "Kết quả bỏ phiếu";
  const body =
    names.length === 0
      ? isNightWindow
        ? "Không ai chết."
        : "Không ai bị treo cổ — hoà phiếu."
      : isNightWindow
        ? `${names.join(", ")} đã chết.`
        : `${names.join(", ")} đã bị treo cổ.`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
