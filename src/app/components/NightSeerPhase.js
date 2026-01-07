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

export default function NightSeerPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // ⭐ loading state

  const audioRef = useRef(null);

  /* ===== FETCH PLAYER INFO ===== */
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

  /* ===== DONE / SKIP ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;

    setIsLoading(true); // ⭐ show loading immediately

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });

    setSelectedPlayer(null);
  };

  /* ===== INITIAL LOADING ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /**
   * ⭐ Seer chỉ tương tác khi WAKEUP
   */
  const isSeerWakeup =
    player.role === ROLES.SEER &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isSeerWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id}) ({player?.role})</p>
        </div>
      </div>
    );
  }

  /* ===== SEER RESULT MAPPING ===== */
  const getSeerResultLabel = (role) => {
    return role === ROLES.WEREWOLF ? "🐺 Sói" : "👤 Người";
  };

  /* ===== SEER WAKEUP VIEW ===== */
  return (
    <div className="relative h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10 shadow-md">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
        <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id}) ({player?.role})</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4">
        <h3 className="text-md mb-3">👥 Chọn người muốn soi</h3>

        <div className="space-y-3 pb-4">
          {playersList.map((p) => (
            <div
              key={p.player_id}
              onClick={() => !isLoading && setSelectedPlayer(p)}
              className="w-full flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 hover:bg-zinc-700 transition cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                <CopyableText label="Name" value={p.username} />
              </div>

              <span className="text-gray-400 text-sm">
                {p.is_connected ? "🟢 Online" : "🔴 Offline"}
              </span>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 z-10">
        <button
          disabled={isLoading}
          onClick={handleDone}
          className={`w-full py-3 rounded-xl font-bold transition ${
            isLoading
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          Bỏ qua
        </button>
      </footer>

      {/* SEER RESULT POPUP */}
      {selectedPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm text-center border border-zinc-700 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-white">
              Kết quả soi
            </h3>

            <div className="w-full flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-4 mb-6">
              <div className="flex flex-col gap-1 text-left">
                <CopyableText label="ID" value={selectedPlayer.player_id} />
                <CopyableText label="Name" value={selectedPlayer.username} />
              </div>

              <span className="text-lg font-bold">
                {getSeerResultLabel(selectedPlayer.role)}
              </span>
            </div>

            <button
              disabled={isLoading}
              onClick={handleDone}
              className={`w-full font-bold py-3 px-4 rounded-xl transition ${
                isLoading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-500"
              }`}
            >
              Đã xong
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
