"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import Loading from "@/components/Loading";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";
import useKeepScreenOn from '../hooks/useKeepScreenOn';
// Font Horror
const fontHorror = localFont({
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf",
  display: "swap",
});

export default function NightGuardPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

  /*===== self-test-start ===== */
  // Giả lập FAKE_PLAYER để tránh lỗi undefined khi debug
  const FAKE_PLAYER = { player_id: 1, username: "Fake Guard", role: "BODYGUARD", is_alive: true, is_connected: true, is_ready: true };


  useKeepScreenOn();
  useEffect(() => {
    // 1. CHẾ ĐỘ DEBUG
    if (roomCode === "DEBUG") {
      const mockPlayers = flow?.data?.players || [];
      const currentPlayer = mockPlayers.find(p => p.player_id === 1) || FAKE_PLAYER;
      
      setPlayer(currentPlayer);
      setPlayersList(mockPlayers.filter(p => p.is_alive && p.is_connected && p.is_ready));
      return;
    }

    // 2. CHẾ ĐỘ CHẠY THẬT
    const socket = getGameSocket();
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode }, player: { ids: [playerId] } }, (res) => {
      if (res?.data?.players?.length) setPlayer(res.data.players[0]);
    });

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (res?.data?.players) {
        setPlayersList(res.data.players.filter((p) => p.is_alive && p.is_connected && p.is_ready));
      }
    });
  }, [roomCode, router, flow]);
  /*===== self-test-end ===== */

  const ROLE_NAME_VN = {
    WEREWOLF: "MA SÓI",
    VILLAGER: " DÂN LÀNG",
    SEER: "TIÊN TRI",
    BODYGUARD: "BẢO VỆ",
    WITCH: "PHÙ THUỶ",
    TANNER: "CHÁN ĐỜI",
    CURSED: "BỊ NGUYỀN",
    SILENCED: "KẺ BỊ CÂM",
    GOD: "HÙNG ANH",
    DEFAULT: "NOTHING",
  };

  /* ===== FETCH PLAYER INFO (Real Logic) ===== */
  useEffect(() => {
    if (!socket) return;
    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode }, player: { ids: [playerId] } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayer(res.data.players[0]);
    });

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready && !p.is_protected
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

  /* ===== ACTIONS ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;
    setIsLoading(true);
    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const handleProtect = (p) => {
    if (!socket || isLoading) return;
    if (selectedPlayer?.player_id === p.player_id) {
      setSelectedPlayer(null);
      return;
    }
    setSelectedPlayer(p);
    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: { id: p.player_id, username: p.username },
    });
  };

  // --- BACKGROUND WRAPPER ---
  const BackgroundWrapper = ({ children }) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">
      <Image src="/image/room_screen.jpg" alt="Horror Background" fill priority className="object-cover opacity-100 contrast-125 saturate-110" />
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none" />
      <div className="relative z-20 w-full h-full max-w-md flex flex-col flex-1">
        {children}
      </div>
    </div>
  );

  /* ===== LOADING STATE ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }
  const roleNameVN = player.role ? ROLE_NAME_VN[player.role] : ROLE_NAME_VN.DEFAULT;

  const isGuardWakeup =
    player.role === ROLES.BODYGUARD &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== PASSIVE VIEW ===== */
  if (!isGuardWakeup) {
    return (
      <BackgroundWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
          <div className="drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 animate-pulse tracking-widest`}>
              {flow.message}
            </h2>
          </div>
          <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
            <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
              Vai trò của bạn : {roleNameVN}
            </p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  /* ===== ACTIVE GUARD VIEW (Đã sửa vị trí nút) ===== */
  return (
    <BackgroundWrapper>
      {/* HEADER */}
      <header className="shrink-0 p-4 pt-8 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-5xl text-[#ce2029] tracking-widest mb-2`}>
          Bảo vệ muốn bảo vệ ai?
        </h2>
         <div className="flex justify-center gap-3">
          <span className="text-xs text-gray-400 font-sans tracking-widest uppercase">
            vai trò của bạn là : Bảo Vệ
          </span>
        </div>
      </header>

      {/* BODY - Button nằm trong này để cuộn cùng list */}
      <main className="flex-1 overflow-y-auto p-4 w-full scrollbar-hide">
        

        <div className="space-y-3 pb-8">
          {/* LIST NGƯỜI CHƠI */}
          {playersList.map((p) => {
            const isSelected = selectedPlayer?.player_id === p.player_id;
            return (
              <div
                key={p.player_id}
                onClick={() => handleProtect(p)}
                className={`group w-full flex items-center justify-between rounded-xl px-5 py-4 transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-sm border
                  ${isSelected
                    ? "bg-green-900/60 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    : "bg-black/70 border-red-900/30 hover:bg-red-950/60 hover:border-red-600"
                  }
                  ${isLoading ? "opacity-60 pointer-events-none" : ""}
                `}
              >
                <div className="flex flex-col items-start">
                  <span className={`${fontHorror.className} text-2xl tracking-wide ${isSelected ? "text-green-100" : "text-gray-200 group-hover:text-red-100"}`}>
                    {p.username}
                  </span>
                  <span className={`text-xs font-sans font-bold ${isSelected ? "text-green-300" : "text-gray-500"}`}>
                    ID: {p.player_id} {p.player_id === player?.player_id ? '(TÔI)' : ''}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {isSelected ? (
                    <span className={`${fontHorror.className} text-2xl text-green-400 animate-pulse`}>
                      ĐANG CHỌN
                    </span>
                  ) : (
                    <span className="text-2xl opacity-20">🛡️</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* --- KHU VỰC BUTTON ĐÃ CHUYỂN VÀO ĐÂY --- */}
          <div className="pt-6">
            {!selectedPlayer ? (
              <button
                disabled={isLoading}
                onClick={handleDone}
                className={`w-full py-3 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                  isLoading
                    ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800"
                }`}
              >
                <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                  Bỏ qua
                </span>
              </button>
            ) : (
              <button
                disabled={isLoading}
                onClick={handleDone}
                className={`w-full py-3 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                  isLoading
                    ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-green-900/80 border-green-600 text-white hover:bg-green-700 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                }`}
              >
                <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                  Bảo vệ
                </span>
              </button>
            )}
          </div>
          {/* --- HẾT KHU VỰC BUTTON --- */}

        </div>
      </main>

      {/* GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </BackgroundWrapper>
  );
}