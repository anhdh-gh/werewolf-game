"use client";

import { useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";
import CopyableText from "@/components/CopyableText";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";

export default function NightWitchKill({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);

  /* ===== FETCH PLAYER INFO ===== */
  useEffect(() => {
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    // self
    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (!res?.data?.players?.length) return;
        setPlayer(res.data.players[0]);
      }
    );

    // all players
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;

      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready
        )
      );
    });
  }, [roomCode, socket, router]);

  /* ===== TTS ===== */
  useEffect(() => {
    if (!flow?.message) return;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    const play = async () => {
      try {
        audio.src = `/api/v1/tts?text=${encodeURIComponent(flow.message)}`;
        audio.load();
        await audio.play();
      } catch (err) {
        console.warn("TTS error:", err?.message);
      }
    };

    play();
    return () => audio.pause();
  }, [flow?.message]);

  /* ===== DONE ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;

    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  /* ===== KILL (VOTE) ===== */
  const handleVote = (p) => {
    if (!socket || isLoading || !canPoison) return;

    setSelectedPlayer(p);

    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: {
        id: p.player_id,
        username: p.username,
      },
    });
  };

  /* ===== INITIAL LOADING ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /* ===== WITCH WAKEUP CHECK ===== */
  const isWitchWakeup =
    player.role === ROLES.WITCH &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  if (!isWitchWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white px-4">
        <p className="text-lg text-gray-300 animate-pulse">
          {flow.message}
        </p>
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id}) ({player?.role})</p>
        </div>
      </div>
    );
  }

  /* ===== LOGIC POISON ===== */
  const canPoison = Number(player.witch_poison) > 0;
  const hasSelected = !!selectedPlayer;

  /* ===== VIEW ===== */
  return (
    <div className="relative h-screen flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
        <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id}) ({player?.role})</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4">
        {!canPoison && (
          <p className="text-yellow-400 mb-3 italic">
            ⚠️ Bạn đã dùng hết bình độc.
          </p>
        )}

        {canPoison && (
          <p className="text-sm text-gray-400 mb-3">
            👉 Click vào người bạn muốn{" "}
            <span className="text-red-400 font-semibold">giết</span>
          </p>
        )}

        <div className="space-y-3">
          {playersList.map((p) => {
            const isSelected =
              selectedPlayer?.player_id === p.player_id;

            return (
              <div
                key={p.player_id}
                onClick={() => handleVote(p)}
                className={`flex justify-between items-center px-4 py-3 rounded-xl transition
                  ${canPoison ? "cursor-pointer" : "opacity-50"}
                  ${
                    isSelected
                      ? "bg-red-700 border border-red-500"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }
                  ${isLoading ? "pointer-events-none opacity-60" : ""}
                `}
              >
                <div className="flex flex-col gap-1">
                  <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                  <CopyableText label="Name" value={p.username} />
                </div>

                <span className="text-red-400 font-bold">☠️ Giết</span>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 p-4 flex gap-3">
        {/* BỎ QUA – CHỈ KHI CHƯA CHỌN AI */}
        {!hasSelected && (
          <button
            disabled={isLoading}
            onClick={handleDone}
            className="flex-1 py-3 rounded-xl font-bold bg-zinc-700 hover:bg-zinc-600"
          >
            Bỏ qua
          </button>
        )}

        {/* ĐÃ XONG */}
        {(canPoison || hasSelected) && (
          <button
            disabled={isLoading}
            onClick={handleDone}
            className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500"
          >
            Đã xong
          </button>
        )}
      </footer>

      {/* LOADING */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
