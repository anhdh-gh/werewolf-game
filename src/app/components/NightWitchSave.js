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

export default function NightWitchSave({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
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

  /* ===== DONE / SKIP ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;

    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  /* ===== SAVE (VOTE) ===== */
  const handleSave = (p) => {
    if (!socket || isLoading || !canHeal) return;

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

  /**
   * ⭐ Witch chỉ tương tác khi WAKEUP
   */
  const isWitchWakeup =
    player.role === ROLES.WITCH &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isWitchWakeup) {
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

  /* ===== LOGIC HEAL ===== */
  const canHeal = Number(player.witch_heal) > 0;
  const candidates = flow?.data?.players || [];

  /* ===== WITCH SAVE VIEW ===== */
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
        {!canHeal && (
          <p className="text-yellow-400 mb-3 italic">
            ⚠️ Bạn đã dùng hết bình cứu.
          </p>
        )}

        {canHeal && (
          <p className="text-sm text-gray-400 mb-3">
            👉 Click vào người bạn muốn{" "}
            <span className="text-green-400 font-semibold">cứu</span>
          </p>
        )}

        {candidates.length === 0 ? (
          <p className="text-gray-500 italic">
            Không có ai để cứu trong đêm nay.
          </p>
        ) : (
          <div className="space-y-3 pb-4">
            {candidates.map((p) => {
              const isSelected =
                selectedPlayer?.player_id === p.player_id;

              return (
                <div
                  key={p.player_id}
                  onClick={() => handleSave(p)}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 transition
                    ${
                      canHeal
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-50"
                    }
                    ${
                      isSelected
                        ? "bg-green-700 border border-green-500"
                        : "bg-zinc-800 hover:bg-zinc-700"
                    }
                    ${isLoading ? "pointer-events-none opacity-60" : ""}
                  `}
                >
                  <div className="flex flex-col gap-1">
                    <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                    <CopyableText label="Name" value={p.username} />
                  </div>

                  <span className="text-green-400 font-bold">
                    ❤️ Cứu
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 z-10 flex gap-3">
        {/* 👉 CHỈ HIỆN BỎ QUA KHI CHƯA CHỌN */}
        {!selectedPlayer && (
          <button
            disabled={isLoading}
            onClick={handleDone}
            className="flex-1 py-3 rounded-xl font-bold bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50"
          >
            Bỏ qua
          </button>
        )}

        {/* ĐÃ XONG – CHỈ KHI CÒN HEAL */}
        {canHeal && (
          <button
            disabled={isLoading}
            onClick={handleDone}
            className="flex-1 py-3 rounded-xl font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50"
          >
            Đã xong
          </button>
        )}
      </footer>

      {/* GLOBAL LOADING */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/100">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
