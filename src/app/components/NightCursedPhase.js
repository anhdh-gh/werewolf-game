"use client";

import { useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";

export default function NightCursedPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);

  /* ===== FETCH SELF PLAYER ===== */
  useEffect(() => {
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (!res?.data?.players?.length) return;
        setPlayer(res.data.players[0]);
      }
    );
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

  /* ===== INITIAL LOADING ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /**
   * ⭐ Chỉ người bị nguyền mới thấy chi tiết
   */
  const isCursedWakeup =
    player.initial_role === ROLES.CURSED &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW (NGƯỜI KHÁC) ===== */
  if (!isCursedWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>

        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id})</p>
        </div>
      </div>
    );
  }

  /* ===== CURSED VIEW ===== */
  return (
    <div className="relative min-h-screen flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
        <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id})</p>
      </header>

      {/* BODY */}
      <main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-400 text-xl font-bold">
          ☠️ Bạn đã bị nguyền
        </p>

        <p className="text-gray-300 text-center">
          Vai trò hiện tại của bạn là:
        </p>

        <div className="px-6 py-3 rounded-xl bg-zinc-800 text-lg font-semibold text-yellow-400">
          {player.role}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-zinc-900 border-t border-zinc-800 p-4">
        <button
          disabled={isLoading}
          onClick={handleDone}
          className="w-full py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50"
        >
          Đã xong
        </button>
      </footer>

      {/* GLOBAL LOADING */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
