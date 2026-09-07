"use client";

import { db } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/useAuth";
import { useRoom } from "@/lib/rooms/useRoom";
import { useGame } from "@/lib/game/useGame";
import { usePrivateState } from "@/lib/game/usePrivateState";
import { useMyAction } from "@/lib/game/useMyAction";
import { requiredActorsForPhase } from "@/lib/game/requiredActors";
import { useServerTimeOffset, useCountdownSeconds, useAutoAdvance } from "@/lib/game/useGameClock";
import {
  useBackgroundAudioKeepAlive,
  usePhaseMediaSession,
  useAutoActionWakeLock,
} from "@/lib/game/useKeepAlive";
import { useNarrationPlayback } from "@/lib/game/useNarrationPlayback";
import { PHASE_LABELS } from "@/lib/game/labels";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { ActionPanel } from "./ActionPanel";
import { RoleCard } from "./RoleCard";
import { PackInfo } from "./PackInfo";
import { MutedBanner } from "./MutedBanner";
import { DeathAnnouncement } from "./DeathAnnouncement";
import { SeerHints } from "./SeerHints";
import { PlayerList } from "./PlayerList";
import { GameEndScreen } from "./GameEndScreen";
import { HunterRevengePrompt } from "./HunterRevenge";
import { ChatPanel } from "./ChatPanel";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";

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

  return (
    <GameScreenInner
      gameId={room.currentGameId}
      uid={user.uid}
      remoteMode={room.settings.remoteMode}
    />
  );
}

function GameScreenInner({
  gameId,
  uid,
  remoteMode,
}: {
  gameId: string;
  uid: string;
  remoteMode: boolean;
}) {
  const { game, loading } = useGame(db, gameId);
  const { privateState } = usePrivateState(db, gameId, uid);
  const serverOffset = useServerTimeOffset(db);
  useAutoAdvance(gameId, game?.phase, serverOffset);
  const secondsLeft = useCountdownSeconds(game?.phase.endsAt ?? 0, serverOffset);
  const myAction = useMyAction(db, gameId, game?.phase.name ?? "", uid);
  const myHunterShot = useMyAction(db, gameId, "HUNTER_SHOT", uid);

  // requiredActorsForPhase takes a full aliveRolesByUid map elsewhere (the
  // server has that from /private via the Admin SDK); here it's given a
  // singleton map containing only this client's own role, which is all a
  // client can ever legitimately know. Passing anyone else's role would
  // require reading their /private state, which Security Rules simply
  // don't allow — this never leaks anything beyond what this uid already has.
  const me = game?.players[uid];
  const isRequired =
    !!game &&
    !!privateState &&
    !!me?.alive &&
    requiredActorsForPhase(game.phase.name, { [uid]: privateState.role }).includes(uid);
  const alreadyDone = myAction?.done ?? false;

  // These three are all hooks (call useEffect internally) — they must run
  // unconditionally on every render, before any early return below, or
  // they'd violate React's rules of hooks the moment `game` loads and an
  // earlier render's early return disappears.
  useBackgroundAudioKeepAlive(!!game && game.phase.name !== "ENDED");
  usePhaseMediaSession(game?.phase, game?.dayNumber);
  useAutoActionWakeLock(isRequired && !alreadyDone);
  useNarrationPlayback(db, gameId, !!game && game.phase.name !== "ENDED");

  if (loading || !game) {
    return (
      <CenteredState>
        <Logo size={44} className="opacity-80" />
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </CenteredState>
    );
  }

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

  // Spec §0/§10: chat only exists in a "Chơi xa" room, and only mirrors the
  // same rooms §10 would auto-join for voice — village during Discussion
  // (everyone alive, matching the one shared call room), wolves during
  // WOLVES (own faction only, derived from this uid's own known role only —
  // see the isRequired comment above for why that's the only role a client
  // can ever legitimately check itself against).
  const isWolfFaction = privateState?.role === "WEREWOLF" || privateState?.role === "TRAITOR";
  const showVillageChat = remoteMode && game.phase.name === "DISCUSSION";
  const showWolvesChat = remoteMode && game.phase.name === "WOLVES" && isWolfFaction;
  const chatLockedReason = !me?.alive
    ? "Bạn đã chết — chỉ xem, không nhắn được nữa"
    : me?.muted
      ? "Hôm nay bạn không được nói"
      : undefined;

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
          <DeathAnnouncement game={game} />
          <MutedBanner muted={me?.muted ?? false} />
          <RoleCard privateState={privateState} />
          <PackInfo privateState={privateState} players={game.players} />
          <SeerHints privateState={privateState} players={game.players} />

          {isRequired && !alreadyDone ? (
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

          {showVillageChat && (
            <ChatPanel
              db={db}
              gameId={gameId}
              scope="village"
              uid={uid}
              players={game.players}
              title="Chat làng"
              lockedReason={chatLockedReason}
            />
          )}
          {showWolvesChat && (
            <ChatPanel
              db={db}
              gameId={gameId}
              scope="wolves"
              uid={uid}
              players={game.players}
              title="Chat sói"
              lockedReason={chatLockedReason}
            />
          )}

          <EnableNotificationsButton uid={uid} />

          <PlayerList players={game.players} meUid={uid} />
        </div>
      </div>
    </main>
  );
}
