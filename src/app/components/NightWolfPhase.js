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

// Font Horror
const fontHorror = localFont({
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf",
  display: "swap",
});

export default function NightWolfPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== CHAT STATE ===== */
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const chatEndRef = useRef(null);

  /* ===== TTS ===== */
  const audioRef = useRef(null);

  /* ===== FETCH PLAYER ===== */
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
        if (res?.data?.players?.length) {
          setPlayer(res.data.players[0]);
        }
      }
    );

    // all players
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players) return;
      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready
        )
      );
    });
  }, [roomCode, socket, router]);

  /* ===== CHAT LISTENER ===== */
  useEffect(() => {
    if (!socket) return;

    const handler = (chat) => {
      if (!chat?.message) return;

      setChatMessages((prev) => {
        const next = [...prev, chat];
        return next.length > 20 ? next.slice(-20) : next;
      });

      if (!isChatOpen && chat.id !== player?.player_id) {
        setHasUnread(true);
      }
    };

    socket.on(EVENTS.ROOM_CHAT, handler);
    return () => socket.off(EVENTS.ROOM_CHAT, handler);
  }, [socket, isChatOpen, player]);

  /* ===== AUTO SCROLL CHAT ===== */
  useEffect(() => {
    if (isChatOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

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
      } catch {}
    };
    play();
    return () => audio.pause();
  }, [flow?.message]);

  /* ===== PERMISSION ===== */
  const canWolfAct =
    player?.role === ROLES.WEREWOLF &&
    player?.is_alive &&
    player?.is_connected &&
    player?.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const hasSelected = !!selectedPlayer;

  /* ===== ACTIONS ===== */
  const handleVote = (p) => {
    if (isLoading) return;
    
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

  const handleDone = () => {
    if (isLoading) return;
    setIsLoading(true);
    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    socket.emit(EVENTS.PLAYER_CHAT, {
      room: { code: roomCode },
      chat: { message: chatInput.trim() },
    });
    setChatInput("");
  };

  /* =========================================
     FIXED LAYOUT WRAPPER 
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

  /* ===== 2. PASSIVE VIEW (Khi không được hành động) ===== */
  if (!canWolfAct) {
    return (
      <BackgroundWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
          <div className="drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 animate-pulse tracking-widest leading-tight`}>
               {flow.message}
            </h2>
          </div>
          <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
              
               <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
                 Vai trò của bạn : {player?.role}
               </p>
          </div>
        </div>
        {/* Global Loading Overlay */}
        {isLoading && (
            <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-black/95 backdrop-blur-xl flex items-center justify-center">
            <Loading textMsg="Đang xử lý..." />
            </div>
        )}
      </BackgroundWrapper>
    );
  }

  /* ===== 3. ACTIVE WOLF VIEW (Khi được hành động) ===== */
  return (
    <BackgroundWrapper>
      {/* HEADER: shrink-0 */}
      <header className="shrink-0 p-4 pt-6 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-5xl md:text-6xl text-[#ce2029] tracking-widest mb-2 leading-none drop-shadow-[0_0_15px_rgba(206,32,41,0.6)]`}>
           Sói muốn cắn ai ?
        </h2>
        <div className="flex justify-center gap-3">
             <span className="bg-red-900/40 px-3 py-1 rounded border border-red-900/50 text-red-200 text-xs font-bold font-sans uppercase">
               vai trò của bạn là : Ma Sói
             </span>
        </div>
      </header>

      {/* BODY: flex-1 + overflow-y-auto */}
      <main className="flex-1 overflow-y-auto p-4 w-full scrollbar-none pb-24">
        <h3 className={`${fontHorror.className} text-3xl text-red-500 mb-4 text-center tracking-wider drop-shadow-[0_2px_2px_black]`}>
             CHỌN CON MỒI
        </h3>

        <div className="space-y-3">
          {playersList.map((p) => {
             const isSelected = selectedPlayer?.player_id === p.player_id;
             return (
               <div
                key={p.player_id}
                onClick={() => handleVote(p)}
                className={`group w-full flex items-center justify-between rounded-xl px-5 py-4 transition-all shadow-lg active:scale-95 backdrop-blur-sm border
                   ${isSelected 
                      ? "bg-red-900/60 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)] cursor-pointer" 
                      : "bg-black/70 border-red-900/30 hover:bg-red-950/60 hover:border-red-600 cursor-pointer"
                   }
                `}
               >
                <div className="flex flex-col items-start">
                    <span className={`${fontHorror.className} text-2xl tracking-wide ${isSelected ? "text-red-100" : "text-gray-200 group-hover:text-red-100"}`}>
                        {p.username}
                    </span>
                    <span className={`text-xs font-sans font-bold ${isSelected ? "text-red-300" : "text-gray-500"}`}>
                         ID: {p.player_id} {p.player_id === player?.player_id ? '(TÔI)' : ''}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    {isSelected ? (
                         <span className={`${fontHorror.className} text-2xl text-red-500 animate-pulse`}>
                            MỤC TIÊU
                         </span>
                    ) : (
                        <span className="text-2xl opacity-40">🩸</span>
                    )}
                </div>
               </div>
             );
          })}

          {/* NÚT BẤM (Đặt trong list để cuộn theo, nằm dưới cùng) */}
          <div className="pt-8">
              <button
                  disabled={isLoading}
                  onClick={handleDone}
                  className={`w-full py-4 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                      isLoading
                        ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
                        : !hasSelected 
                          ? "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white" // Bỏ qua
                          : "bg-red-900/80 border-red-600 text-white hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)]" // Xác nhận
                    }`}
              >
                  <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                      {hasSelected ? "XÁC NHẬN CẮN" : "BỎ QUA"}
                  </span>
              </button>
          </div>
        </div>
      </main>

      {/* CHAT BUTTON (FIXED POSITION) */}
      {/* Sử dụng class 'fixed' thay vì 'absolute' để ghim cứng vào góc màn hình */}
      <button
        onClick={() => {
          setIsChatOpen(true);
          setHasUnread(false);
        }}
        className="fixed bottom-6 right-6 z-40 bg-red-900/90 border-2 border-red-500 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-110 transition-transform active:scale-95"
      >
        <span className="text-2xl filter drop-shadow-md">💬</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full animate-ping" />
        )}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full" />
        )}
      </button>

      {/* CHAT MODAL (Fixed Overlay) */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <header className="p-4 border-b-2 border-red-900/50 flex justify-between items-center bg-red-950/20 shrink-0">
            <div className="flex items-center gap-2">
                 <span className="text-2xl">🐺</span>
                 <span className={`${fontHorror.className} text-2xl text-red-500 tracking-widest`}>
                    HỘI BÀN TRÒN
                 </span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white text-3xl font-bold px-2">&times;</button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-black">
            {chatMessages.map((c, i) => {
              const isSelf = c.id === player.player_id;
              return (
                <div key={i} className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 max-w-[85%]">
                        {!isSelf && (
                             <div className="w-8 h-8 rounded-full bg-red-900 border border-red-500 flex items-center justify-center text-xs font-bold text-red-200">
                                {c.id}
                             </div>
                        )}
                        <div className={`rounded-2xl px-4 py-3 border ${isSelf ? "bg-red-900/40 border-red-500 text-red-100 rounded-tr-none" : "bg-zinc-800/80 border-gray-600 text-gray-200 rounded-tl-none"}`}>
                            <p className="text-sm font-sans">{c.message}</p>
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 px-1">{isSelf ? "Bạn" : c.username}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-red-900/30 bg-black/80 flex gap-3 shrink-0">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-zinc-900/50 border border-red-900/50 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 placeholder-gray-600 transition-colors"
            />
            <button onClick={handleSendChat} className="bg-red-900 hover:bg-red-700 text-white px-6 rounded-xl font-bold border border-red-600 transition-all shadow-[0_0_10px_rgba(220,38,38,0.3)]">GỬI</button>
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