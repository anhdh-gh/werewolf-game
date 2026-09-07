"use client";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useRoom } from "@/lib/rooms/useRoom";
import { useGame } from "@/lib/game/useGame";
import { usePrivateState } from "@/lib/game/usePrivateState";
import { useMyAction } from "@/lib/game/useMyAction";
import { useServerTimeOffset, useCountdownSeconds, useAutoAdvance } from "@/lib/game/useGameClock";
import { PHASE_LABELS } from "@/lib/game/labels";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ActionPanel } from "./ActionPanel";
import { RoleCard } from "./RoleCard";
import { PlayerList } from "./PlayerList";
import { GameEndScreen } from "./GameEndScreen";
import { HunterRevengePrompt } from "./HunterRevenge";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 animate-in fade-in-0 duration-300">
      {children}
    </main>
  );
}

export function GameScreen({ code }: { code: string }) {
  const { user } = useAuth();
  const { room, loading: roomLoading } = useRoom(db, code);

  if (roomLoading || !room) {
    return (
      <CenteredState>
        <Logo size={44} className="opacity-80" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </CenteredState>
    );
  }

  if (!room.currentGameId || !user) {
    return (
      <CenteredState>
        <p className="text-muted-foreground">Chưa có ván nào đang diễn ra</p>
      </CenteredState>
    );
  }

  return <GameScreenInner gameId={room.currentGameId} uid={user.uid} />;
}

function GameScreenInner({ gameId, uid }: { gameId: string; uid: string }) {
  const { game, loading } = useGame(db, gameId);
  const { privateState } = usePrivateState(db, gameId, uid);
  const serverOffset = useServerTimeOffset(db);
  useAutoAdvance(gameId, game?.phase, serverOffset);
  const secondsLeft = useCountdownSeconds(game?.phase.endsAt ?? 0, serverOffset);
  const myAction = useMyAction(db, gameId, game?.phase.name ?? "", uid);
  const myHunterShot = useMyAction(db, gameId, "HUNTER_SHOT", uid);

  if (loading || !game) {
    return (
      <CenteredState>
        <Logo size={44} className="opacity-80" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </CenteredState>
    );
  }

  const me = game.players[uid];
  const isDeadHunterWithUnfiredShot =
    !!me && !me.alive && privateState?.role === "HUNTER" && !myHunterShot?.done;

  // Spec §4.4 step 8: a dead Hunter always gets their shot — even when
  // their own death is the one that just ended the game. Their shot still
  // fires for narrative completeness (a name they choose gets marked
  // dead), but it deliberately does not reopen an already-decided winner:
  // announcing a result and then retracting it moments later would be a
  // worse experience than the rare case where the shot could in theory
  // have changed the outcome.
  if (game.phase.name === "ENDED" && !isDeadHunterWithUnfiredShot) {
    return <GameEndScreen game={game} />;
  }

  if (isDeadHunterWithUnfiredShot) {
    return (
      <main className="flex min-h-dvh flex-col items-center gap-5 p-6">
        <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
          <HunterRevengePrompt db={db} gameId={gameId} uid={uid} game={game} />
        </div>
      </main>
    );
  }

  const isRequired = game.phase.requiredActors.includes(uid);
  const alreadyDone = myAction?.done ?? false;

  return (
    <main className="flex min-h-dvh flex-col items-center gap-5 p-6">
      <div className="w-full max-w-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-500">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Ngày {game.dayNumber}</p>
            <h1 className="font-heading text-xl tracking-wide">{PHASE_LABELS[game.phase.name]}</h1>
          </div>
          <span className="font-heading text-2xl tabular-nums">{secondsLeft}s</span>
        </div>

        <div className="flex flex-col gap-4">
          <RoleCard privateState={privateState} />

          {isRequired && !alreadyDone && me?.alive ? (
            <Card>
              <CardHeader>
                <CardTitle>Đến lượt bạn</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionPanel db={db} gameId={gameId} uid={uid} game={game} privateState={privateState} />
              </CardContent>
            </Card>
          ) : (
            <p className="rounded-md bg-muted px-3 py-4 text-center text-sm text-muted-foreground">
              {me?.alive ? "Đang chờ những người khác…" : "Bạn đã chết — theo dõi ván đấu"}
            </p>
          )}

          <PlayerList players={game.players} meUid={uid} requiredActors={game.phase.requiredActors} />
        </div>
      </div>
    </main>
  );
}
