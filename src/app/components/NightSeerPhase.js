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
        res.data.players.filter((p) => p.is_alive && p.is_connected)
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

  const handleDone = () => {
    if (!socket) return;

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });

    setSelectedPlayer(null);
  };

  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /**
   * ⭐ Seer chỉ tương tác khi WAKEUP
   */
  const isSeerWakeup =
    player.role === ROLES.SEER &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isSeerWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>
      </div>
    );
  }

  /* ===== SEER RESULT MAPPING ===== */
  const getSeerResultLabel = (role) => {
    return role === ROLES.WEREWOLF ? "🐺 Sói" : "👤 Người";
  };

  /* ===== SEER WAKEUP VIEW ===== */
  return (
    // FIX: Sử dụng Flexbox layout thay vì Fixed position để tránh bị đè content
    <div className="relative h-screen flex flex-col bg-black text-white overflow-hidden">
      
      {/* HEADER */}
      {/* shrink-0 để header không bị co lại, z-10 để bóng đổ đè lên content khi cuộn */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10 shadow-md">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
      </header>

      {/* BODY */}
      {/* flex-1 để chiếm hết khoảng trống còn lại, overflow-y-auto để cuộn riêng phần danh sách */}
      <main className="flex-1 overflow-y-auto p-4">
        <h3 className="text-md mb-3">👥 Chọn người muốn soi</h3>

        <div className="space-y-3 pb-4"> 
          {playersList.map((p) => (
            <div
              key={p.player_id}
              onClick={() => setSelectedPlayer(p)}
              className="w-full flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 hover:bg-zinc-700 transition cursor-pointer"
            >
              <div className="flex flex-col gap-1">
                <CopyableText label="ID" value={p.player_id} />
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
      {/* shrink-0 để footer luôn hiển thị ở đáy */}
      <footer className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 z-10">
        <button
          onClick={handleDone}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold transition"
        >
          Bỏ qua
        </button>
      </footer>

      {/* SEER RESULT POPUP */}
      {selectedPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-sm text-center border border-zinc-700 shadow-2xl">
            <h3 className="text-lg font-bold mb-4 text-white">Kết quả soi</h3>
            
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
              onClick={handleDone}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              Đã xong
            </button>
          </div>
        </div>
      )}
    </div>
  );
}