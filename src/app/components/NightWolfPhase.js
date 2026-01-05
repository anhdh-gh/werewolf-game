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

export default function NightWolfPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const audioRef = useRef(null);

  /* ===== FETCH PLAYER INFO ===== */
  useEffect(() => {
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    // Lấy thông tin chính mình
    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (!res?.data?.players?.length) return;
        setPlayer(res.data.players[0]);
      }
    );

    // Lấy danh sách người chơi còn sống
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayersList(
        res.data.players.filter((p) => p.is_alive && p.is_connected && p.is_ready)
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
    if (!socket) return;

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });

    setSelectedPlayer(null);
  };

  /* ===== VOTE ===== */
  const handleVote = (p) => {
    if (!socket) return;

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

  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /**
   * ⭐ Wolf chỉ tương tác khi WAKEUP
   */
  const isWolfWakeup =
    player.role === ROLES.WEREWOLF && player?.is_alive && player?.is_connected && player?.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isWolfWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>
      </div>
    );
  }

  /* ===== WOLF WAKEUP VIEW ===== */
  return (
    <div className="relative h-screen flex flex-col bg-black text-white overflow-hidden">
      
      {/* HEADER */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10 shadow-md">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4">
        <h3 className="text-md mb-3">🐺 Chọn người để cắn</h3>

        <div className="space-y-3 pb-4">
          {playersList.map((p) => {
            const isSelected = selectedPlayer?.player_id === p.player_id;

            return (
              <div
                key={p.player_id}
                onClick={() => handleVote(p)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition
                  ${
                    isSelected
                      ? "bg-red-700 border border-red-500"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }
                `}
              >
                <div className="flex flex-col gap-1">
                  <CopyableText label="ID" value={p.player_id} />
                  <CopyableText label="Name" value={p.username} />
                </div>

                <span className="text-gray-400 text-sm">
                  {p.is_connected ? "🟢 Online" : "🔴 Offline"}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 z-10 flex gap-3">
        <button
          onClick={handleDone}
          className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold transition"
        >
          Bỏ qua
        </button>

        <button
          onClick={handleDone}
          className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold transition"
        >
          Đã xong
        </button>
      </footer>
    </div>
  );
}
