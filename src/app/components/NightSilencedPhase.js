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
import localFont from "next/font/local";

/*===== self-test-start ===== */
  // ... import như cũ ...

const FAKE_PLAYER = {
  player_id: 1,
  username: "Fake Player",
  role: "WITCH",
  initial_role: "WITCH",
  is_alive: true,
  is_connected: true,
  is_ready: true,
};

  useEffect(() => {
    // 🔹 Nếu đang ở chế độ debug (roomCode = "DEBUG") thì dùng fake player, KHÔNG gọi socket
    if (roomCode === "DEBUG") {
      setPlayer(FAKE_PLAYER);
      return;
    }
  
    const socket = getGameSocket();
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
  }, [roomCode, router]);

  /*===== self-test-end ===== */

const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});


export default function NightSilencedPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);


const ROLE_NAME_VN = {
  WEREWOLF: "MA SÓI",
  VILLAGER: " DÂN LÀNG",
  SEER: "TIÊN TRI",
  GUARD: "BẢO VỆ",
  WITCH: "PHÙ THUỶ",
  TANNER: "CHÁN ĐỜI",
  CURSED: "BỊ NGUYỀN",
  SILENCED: "KẺ BỊ CÂM",
  GOD: "HÙNG ANH",
  DEFAULT: "NOTHING",
};

  /* ===== FETCH PLAYER INFO ===== */
  useEffect(() => {
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    // Self
    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (!res?.data?.players?.length) return;
        setPlayer(res.data.players[0]);
      }
    );

    // All players
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

    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  /* ===== SILENCE (VOTE) ===== */
  const handleSilence = (p) => {
    if (!socket || isLoading) return;

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

const roleNameVN = player.role ? ROLE_NAME_VN[player.role] : ROLE_NAME_VN.DEFAULT;



  const isSilencerWakeup =
    player.role === ROLES.SILENCED &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isSilencerWakeup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>
         <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
            <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
              Vai trò của bạn : {roleNameVN}
            </p>
          </div>
      </div>
    );
  }

  /* ===== SILENCER VIEW ===== */
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
        <p className="text-sm text-gray-400 mb-3">
          👉 Click vào người bạn muốn{" "}
          <span className="text-purple-400 font-semibold">làm câm</span>
        </p>

        <div className="space-y-3 pb-4">
          {playersList.map((p) => {
            const isSelected =
              selectedPlayer?.player_id === p.player_id;

            return (
              <div
                key={p.player_id}
                onClick={() => handleSilence(p)}
                className={`w-full flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition
                  ${
                    isSelected
                      ? "bg-purple-700 border border-purple-500"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }
                  ${isLoading ? "opacity-60 pointer-events-none" : ""}
                `}
              >
                <div className="flex flex-col gap-1">
                  <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                  <CopyableText label="Name" value={p.username} />
                </div>

                <span className="text-purple-400 font-bold">
                  🤐 Câm
                </span>
              </div>
            );
          })}
        </div>
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

        {/* ĐÃ XONG – LUÔN CÓ */}
        <button
          disabled={isLoading}
          onClick={handleDone}
          className="flex-1 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
        >
          Đã xong
        </button>
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
