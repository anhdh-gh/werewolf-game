"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image"; // Import Image
import { Creepster } from "next/font/google"; // Import Font
import Loading from "@/components/Loading";
import CopyableText from "@/components/CopyableText";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";

// Khởi tạo font Horror
const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });

export default function NightSeerPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef(null);

  /*===== self-test-start (LOGIC CŨ GIỮ NGUYÊN) ===== */
  const FAKE_PLAYER = {
    player_id: 1,
    username: "Fake Player",
    role: "SEER",
    initial_role: "SEER",
    is_alive: true,
    is_connected: true,
    is_ready: true,
  };

  useEffect(() => {
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

  /* ===== FETCH PLAYER INFO (LOGIC CŨ GIỮ NGUYÊN) ===== */
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

  /* ===== TTS (LOGIC CŨ GIỮ NGUYÊN) ===== */
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

  /* ===== DONE / SKIP (LOGIC CŨ GIỮ NGUYÊN) ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;

    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });

    setSelectedPlayer(null);
  };

  /* ===== RENDER ===== */
  
  // 1. Loading State
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  // Check Role logic
  const isSeerWakeup =
    player.role === ROLES.SEER &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const getSeerResultLabel = (role) => {
    return role === ROLES.WEREWOLF ? "🐺 SÓI" : "👤 NGƯỜI";
  };

  // --- BACKGROUND WRAPPER (Dùng chung cho cả 2 view) ---
  const BackgroundWrapper = ({ children }) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col">
       {/* Background Image */}
       <Image
        src="/image/room_screen.jpg" // Đảm bảo bạn có ảnh này trong public/image
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-100 contrast-125 saturate-110"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none" />
      
      {/* Content z-index cao hơn overlay */}
      <div className="relative z-20 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );

  /* ===== PASSIVE VIEW (Khi không phải lượt mình) ===== */
  if (!isSeerWakeup) {
    return (
      <BackgroundWrapper>
        <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6 text-center">
          <div className="drop-shadow-[0_0_15px_rgba(0,0,0,1)] space-y-4">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 animate-pulse tracking-widest`}>
               {flow.message}
            </h2>
            <div className="bg-black/40 px-6 py-2 rounded-full border border-gray-700/50 inline-block">
               <p className={`${fontHorror.className} text-xl text-red-500`}>
                 {player?.username} (ID: {player?.player_id})
               </p>
               <p className="text-sm text-gray-400 font-sans tracking-widest uppercase">
                 Vai trò: {player?.role}
               </p>
            </div>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  /* ===== ACTIVE SEER WAKEUP VIEW (Giao diện chính) ===== */
  return (
    <BackgroundWrapper>
      {/* HEADER */}
      <header className="shrink-0 p-4 pt-6 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-4xl text-[#ce2029] tracking-widest mb-1`}>
          {flow.message}
        </h2>
        <div className="flex justify-center gap-3 text-sm">
             <span className="bg-red-900/40 px-3 py-1 rounded border border-red-900/50 text-gray-300 font-bold">
               Room #{roomCode}
             </span>
             <span className="bg-red-900/40 px-3 py-1 rounded border border-red-900/50 text-red-200 font-bold">
               {player?.username} ({player?.role})
             </span>
        </div>
      </header>

      {/* BODY - PLAYER LIST */}
      <main className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full">
        <h3 className={`${fontHorror.className} text-2xl text-red-500 mb-4 text-center tracking-wider drop-shadow-md`}>
           👁️ CHỌN KẺ MUỐN SOI
        </h3>

        <div className="space-y-3 pb-24">
          {playersList.map((p) => (
            <div
              key={p.player_id}
              onClick={() => !isLoading && setSelectedPlayer(p)}
              className="group w-full flex items-center justify-between rounded-xl bg-black/60 border-2 border-red-900/30 px-5 py-4 hover:bg-red-950/40 hover:border-red-600/80 transition-all cursor-pointer shadow-lg active:scale-98"
            >
              <div className="flex flex-col items-start">
                <span className={`${fontHorror.className} text-2xl text-gray-200 group-hover:text-red-100`}>
                  {p.username}
                </span>
                <span className="text-xs text-gray-500 font-sans font-bold">
                   ID: {p.player_id} {p.player_id === player?.player_id ? '(TÔI)' : ''}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold tracking-widest uppercase ${p.is_connected ? "text-green-500" : "text-gray-600"}`}>
                   {p.is_connected ? "● ONLINE" : "○ OFFLINE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER - SKIP BUTTON */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 z-30 bg-gradient-to-t from-black via-black/90 to-transparent pb-6">
        <div className="max-w-md mx-auto">
          <button
            disabled={isLoading}
            onClick={handleDone}
            className={`w-full py-3 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
              isLoading
                ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800"
            }`}
          >
            <span className={`${fontHorror.className} text-2xl tracking-widest uppercase`}>
               Bỏ qua lượt
            </span>
          </button>
        </div>
      </footer>

      {/* SEER RESULT POPUP */}
      {selectedPlayer && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-black/90 border-2 border-red-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col gap-6 relative">
            
            {/* Tiêu đề Popup */}
            <h3 className={`${fontHorror.className} text-3xl text-red-500 text-center tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]`}>
               KẾT QUẢ SOI
            </h3>

            {/* Thông tin người bị soi */}
            <div className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className={`${fontHorror.className} text-2xl text-white`}>
                   {selectedPlayer.username}
                 </span>
                 <span className="text-xs text-red-400 font-bold">ID: {selectedPlayer.player_id}</span>
              </div>
              
              {/* Kết quả (SÓI / NGƯỜI) */}
              <div className={`${fontHorror.className} text-3xl tracking-wider ${
                  selectedPlayer.role === ROLES.WEREWOLF ? "text-red-600 drop-shadow-[0_0_10px_red]" : "text-green-500 drop-shadow-[0_0_10px_green]"
              }`}>
                {getSeerResultLabel(selectedPlayer.role)}
              </div>
            </div>

            {/* Nút xác nhận */}
            <button
              disabled={isLoading}
              onClick={handleDone}
              className={`w-full py-3 rounded-xl border-2 transition-all ${
                isLoading
                  ? "bg-gray-800 border-gray-600 text-gray-500"
                  : "bg-red-900/80 border-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              }`}
            >
              <span className={`${fontHorror.className} text-2xl tracking-widest`}>
                XÁC NHẬN & NGỦ
              </span>
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </BackgroundWrapper>
  );
}