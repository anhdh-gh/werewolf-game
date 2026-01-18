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

// Khởi tạo font Horror
const fontHorror = localFont({
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf",
  display: "swap",
});

export default function NightSeerPhase({ roomCode, flow }) {
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

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode }, player: { ids: [playerId] } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayer(res.data.players[0]);
    });

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayersList(res.data.players.filter((p) => p.is_alive && p.is_connected && p.is_ready));
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
    setSelectedPlayer(null);
  };

  const getSeerResultLabel = (role) => {
    return role === ROLES.WEREWOLF ? "🐺 SÓI" : "👤 NGƯỜI";
  };

  /* =========================================
     FIXED LAYOUT WRAPPER
     Sử dụng mô hình Flexbox chuẩn:
     [ Header (cố định) ]
     [ Main (co giãn flex-1, cuộn nội bộ) ]
     [ Footer (cố định) ]
     ========================================= */
  const BackgroundWrapper = ({ children }) => (
    <div className="fixed inset-0 w-full h-[100dvh] bg-black overflow-hidden flex flex-col">
       {/* 1. Background Image Layer (Z-0) */}
       <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/image/room_screen.jpg"
            alt="Horror Background"
            fill
            priority
            className="object-cover opacity-100 contrast-125 saturate-110"
          />
          <div className="absolute inset-0 bg-black/60" />
       </div>
      
      {/* 2. Content Container (Z-10) - Flex Column Layout */}
      <div className="relative z-10 w-full h-full max-w-md mx-auto flex flex-col">
        {children}
      </div>
    </div>
  );

  /* ===== 1. INITIAL LOADING (FIXED FULL SCREEN Z-MAX) ===== */
  if (!flow?.message || !player) {
    return (
      <div className="fixed inset-0 w-screen h-[100dvh] z-[9999] bg-black flex items-center justify-center">
        <Loading textMsg="Đang chuẩn bị..." />
      </div>
    );
  }

  const isSeerWakeup =
    player.role === ROLES.SEER &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  /* ===== 2. PASSIVE VIEW (Không phải lượt) ===== */
  if (!isSeerWakeup) {
    return (
      <BackgroundWrapper>
        {/* Nội dung căn giữa màn hình */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
          <div className="drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 animate-pulse tracking-widest leading-tight`}>
               {flow.message}
            </h2>
          </div>
          <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
               <p className={`${fontHorror.className} text-2xl text-red-500`}>
                 {player?.username}
               </p>
               <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
                 ID: {player?.player_id} | Role: {player?.role}
               </p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  /* ===== 3. ACTIVE VIEW (Lượt chơi) ===== */
  return (
    <BackgroundWrapper>
      {/* HEADER: shrink-0 (Không bị co lại) */}
      <header className="shrink-0 p-4 pt-6 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-5xl md:text-6xl text-[#ce2029] tracking-widest mb-2 leading-none drop-shadow-[0_0_15px_rgba(206,32,41,0.6)]`}>
          {flow.message}
        </h2>
        <div className="flex justify-center gap-3">
             <span className="bg-red-900/40 px-3 py-1 rounded border border-red-900/50 text-gray-300 text-xs font-bold font-sans uppercase">
               Room #{roomCode}
             </span>
             <span className="bg-red-900/40 px-3 py-1 rounded border border-red-900/50 text-red-200 text-xs font-bold font-sans uppercase">
               {player?.username} ({player?.role})
             </span>
        </div>
      </header>

      {/* BODY: flex-1 (Chiếm hết khoảng trống còn lại) + overflow-y-auto (Cuộn nội bộ) */}
      <main className="flex-1 overflow-y-auto p-4 w-full scrollbar-hide">

        <div className="space-y-3">
          {playersList.map((p) => (
            <div
              key={p.player_id}
              onClick={() => !isLoading && setSelectedPlayer(p)}
              className="group w-full flex items-center justify-between rounded-xl bg-black/70 border border-red-900/30 px-5 py-4 hover:bg-red-950/60 hover:border-red-600 transition-all cursor-pointer shadow-lg active:scale-95 backdrop-blur-sm"
            >
              <div className="flex flex-col items-start">
                <span className={`${fontHorror.className} text-2xl text-gray-200 group-hover:text-red-100 tracking-wide`}>
                  {p.username}
                </span>
                <span className="text-xs text-gray-500 font-sans font-bold">
                   ID: {p.player_id} {p.player_id === player?.player_id ? '(ME)' : ''}
                </span>
              </div>

              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold tracking-widest uppercase ${p.is_connected ? "text-green-500 drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "text-gray-600"}`}>
                   {p.is_connected ? "● ONLINE" : "○ OFFLINE"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* FOOTER: shrink-0 (Nằm dưới cùng, không đè lên content) */}
      <footer className="shrink-0 p-4 pb-6 w-full z-30 bg-gradient-to-t from-black via-black/90 to-transparent">
        <div className="max-w-md mx-auto">
          <button
            disabled={isLoading}
            onClick={handleDone}
            className={`w-full py-3 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
              isLoading
                ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white hover:bg-gray-800 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
            }`}
          >
            <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
               Bỏ qua lượt
            </span>
          </button>
        </div>
      </footer>

      {/* POPUP RESULT (Fixed Overlay) */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-black border-2 border-red-600 rounded-3xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col gap-6 relative">
            <h3 className={`${fontHorror.className} text-4xl text-red-500 text-center tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]`}>
               KẾT QUẢ SOI
            </h3>

            <div className="w-full bg-red-950/20 border border-red-900/50 rounded-xl p-4 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className={`${fontHorror.className} text-3xl text-white tracking-wide`}>
                   {selectedPlayer.username}
                 </span>
                 <span className="text-xs text-red-400 font-bold font-sans">ID: {selectedPlayer.player_id}</span>
              </div>
              
              <div className={`${fontHorror.className} text-4xl tracking-wider ${
                  selectedPlayer.role === ROLES.WEREWOLF ? "text-red-600 drop-shadow-[0_0_15px_red]" : "text-green-500 drop-shadow-[0_0_15px_green]"
              }`}>
                {getSeerResultLabel(selectedPlayer.role)}
              </div>
            </div>

            <button
              disabled={isLoading}
              onClick={handleDone}
              className={`w-full py-3 rounded-xl border-2 transition-all ${
                isLoading
                  ? "bg-gray-800 border-gray-600 text-gray-500"
                  : "bg-red-900/80 border-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              }`}
            >
              <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                XÁC NHẬN
              </span>
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL LOADING OVERLAY (Z-MAX) */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </BackgroundWrapper>
  );
}