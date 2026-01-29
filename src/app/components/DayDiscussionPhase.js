"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Creepster, Nosifer } from "next/font/google";
import { EVENTS } from "@/constants/events";
import { getGameSocket } from "@/socket/gameSocket";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import Loading from "@/components/Loading";
import CopyableText from "@/components/CopyableText";
import { useRouter } from "next/navigation";
import { ACTIONS } from "@/constants/actions";
import localFont from "next/font/local";
import { Icon } from '@iconify/react'; 
import useKeepScreenOn from '../hooks/useKeepScreenOn';
const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});

useKeepScreenOn();


export default function DayDiscussionPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== CHAT ===== */
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const chatEndRef = useRef(null);

  const audioRef = useRef(null);

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


  /* ===== LOGIC GIỮ NGUYÊN (FETCH SELF PLAYER) ===== */
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

  /* ===== LOGIC GIỮ NGUYÊN (FLOW ACTION) ===== */
  useEffect(() => {
    if (!flow?.event?.action) return;
    if (
      flow.event.action === ACTIONS.VIEW ||
      flow.event.action === ACTIONS.VOTE
    ) {
      setIsVoting(false);
      setIsLoading(false);
      setSelectedPlayer(null);
    }
  }, [flow]);

  /* ===== LOGIC GIỮ NGUYÊN (TTS) ===== */
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

  /* ===== LOGIC GIỮ NGUYÊN (CHAT LISTENER) ===== */
  useEffect(() => {
    if (!socket) return;
    const handler = (chat) => {
      console.log("🌞 [DAY CHAT RAW]:", chat);
      if (!chat?.message) return;
      setChatMessages((prev) => {
        const next = [...prev, chat];
        return next.length > 10 ? next.slice(-10) : next;
      });
      if (!isChatOpen && chat.id !== player?.player_id) {
        setHasUnread(true);
      }
    };
    socket.on(EVENTS.ROOM_CHAT, handler);
    return () => socket.off(EVENTS.ROOM_CHAT, handler);
  }, [socket, isChatOpen, player]);

  /* ===== LOGIC GIỮ NGUYÊN (AUTO SCROLL) ===== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  if (!player) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loading textMsg="Đang chuẩn bị..." />
      </div>
    );
  }

  /* ===== LOGIC GIỮ NGUYÊN (INTERACTION) ===== */
  const canInteract =
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.VOTE;

  const loadPlayersForVote = () => {
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready && player?.player_id !== p?.player_id
        )
      );
      setIsVoting(true);
    });
  };

  const handleVote = (p) => {
    if (isLoading) return;
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

  const deadPlayers = Array.isArray(flow?.data?.players)
    ? flow.data.players
    : [];

  /* ===== UI UPDATE STARTS HERE ===== */
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col">
      {/* 1. Nền Ma Mị (Giống ServerPage) */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="Background"
        fill
        priority
        className="object-cover opacity-60 contrast-125 saturate-50 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/80 pointer-events-none z-0" />

      {/* Nội dung chính (z-10 để nổi lên trên nền) */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-md mx-auto text-gray-200">
        
        {/* HEADER */}
        <header className="p-5 flex flex-col items-center gap-1 border-b border-white/5 bg-black/40 backdrop-blur-sm">
          <h2 className={`${fontHorror.className} text-3xl text-red-500 tracking-widest drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] text-center`}>
            {flow.message}
          </h2>
          <div className="flex items-center gap-3 text-xs font-mono opacity-60">
             <span>Vai trò của bạn : {player?.role}</span>
          </div>
        </header>

        {/* BODY (List Players) */}
        <main className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
          
          {/* DANH SÁCH NGƯỜI CHẾT (Nếu có) */}
          {deadPlayers.length > 0 && (
            <div className="space-y-2">
               <h3 className={`${fontHorror.className} text-xl text-gray-500 border-b border-gray-700/50 pb-1 mb-2`}>
                 Hồn ma vất vưởng
               </h3>
               {deadPlayers.map((p) => (
                <div
                  key={p.player_id}
                  className="relative w-full rounded-xl p-3 bg-black/60 border border-zinc-800 flex items-center justify-between opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="text-gray-300 font-bold text-sm">{p?.username}</div>
                    <div className="text-[10px] font-mono opacity-40">ID: {p?.player_id}</div>
                  </div>
                  <span className={`${fontHorror.className} text-xl text-purple-400`}>
                    {p?.is_muted ? '🤐' : '💀'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* DANH SÁCH VOTE (Khi bấm Vote) */}
          {isVoting && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-3">
              <h3 className={`${fontHorror.className} text-2xl text-[#990000] text-center drop-shadow-md mb-4`}>
                Chọn kẻ hiến tế
              </h3>
              {playersList.map((p) => {
                const isSelected = selectedPlayer?.player_id === p.player_id;
                return (
                  <button
                    key={p.player_id}
                    onClick={() => handleVote(p)}
                    className={`relative w-full rounded-xl p-4 transition-all duration-300 flex items-center justify-between group
                      ${isSelected 
                        ? "bg-red-950/60 border-2 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]" 
                        : "bg-black/40 border border-white/10 hover:border-red-900/50 hover:bg-red-900/10"
                      }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className={`font-bold ${isSelected ? "text-red-400" : "text-gray-300 group-hover:text-red-200"}`}>
                        {p.username}
                      </span>
                      <span className="text-[10px] font-mono opacity-30 uppercase">ID: {p.player_id}</span>
                    </div>
                    {isSelected && <span className="text-xl">🩸</span>}
                  </button>
                );
              })}
            </div>
          )}
        </main>

        {/* FOOTER ACTIONS */}
        {canInteract && (
          <footer className="p-4 pb-6 bg-gradient-to-t from-black via-black/90 to-transparent flex gap-3">
            {!isVoting ? (
              <button
                onClick={loadPlayersForVote}
                className="relative w-full py-4 rounded-xl text-red-100 bg-[#7f1d1d] hover:bg-red-700 border border-red-900 transition-all overflow-hidden group shadow-lg"
              >
                <span className={`${fontHorror.className} relative z-10 text-2xl tracking-widest`}>
                  TIẾN HÀNH VOTE
                </span>
                {/* Hiệu ứng máu rơi nhẹ */}
                <div className="absolute top-0 right-[20%] w-[1px] h-3 bg-red-400/30 group-hover:h-6 transition-all" />
              </button>
            ) : (
              <>
                {!selectedPlayer && (
                  <button
                    onClick={handleDone}
                    className="flex-1 py-4 rounded-xl text-gray-400 bg-zinc-900/80 border border-white/10 hover:bg-zinc-800 transition-colors"
                  >
                    <span className={`${fontHorror.className} text-xl`}>BỎ QUA</span>
                  </button>
                )}
                <button
                  onClick={handleDone}
                  className="flex-1 py-4 rounded-xl text-red-100 bg-[#7f1d1d] hover:bg-red-700 border border-red-900 transition-colors shadow-[0_0_10px_rgba(127,29,29,0.5)]"
                >
                  <span className={`${fontHorror.className} text-xl tracking-widest`}>CHỐT ĐƠN</span>
                </button>
              </>
            )}
          </footer>
        )}

        {/* CHAT BUTTON (Floating) */}
        {canInteract && !player?.is_muted && (
          <button
            onClick={() => {
              setIsChatOpen(true);
              setHasUnread(false);
            }}
            className="fixed bottom-24 right-4 bg-red-950/90  w-14 h-14 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] z-40 flex items-center justify-center hover:scale-110 transition-transform"
          >
            <span className="text-2xl"><Icon 
    icon="ri:chat-ai-fill" // Tên icon để trong nháy kép
    width="28" 
    height="28" 
    style={{ color: '#e4e4e4' }} // Bạn có thể chỉnh màu ở đây
  /></span>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping border border-black" />
            )}
          </button>
        )}

        {/* CHAT MODAL (Overlay) */}
        {isChatOpen && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-sm animate-in fade-in duration-200">
            {/* Chat Header */}
            <header className="p-4 border-b border-red-900/30 flex justify-between items-center bg-red-950/20">
              <span className={`${fontHorror.className} text-2xl text-red-500 tracking-wider`}>
                 Hội Đồng Làng
              </span>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-gray-400 hover:text-white text-xl px-2"
              >
                ✕
              </button>
            </header>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {chatMessages.map((c, i) => {
                 const isMe = c.id === player.player_id;
                 return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-3 border 
                      ${isMe 
                        ? "bg-red-900/30 border-red-800 text-red-100 rounded-tr-none" 
                        : "bg-zinc-900/60 border-white/10 text-gray-300 rounded-tl-none"
                      }`}
                    >
                      <p className="text-[10px] font-mono opacity-50 mb-1 uppercase tracking-tighter">
                        {c.username}
                      </p>
                      <p className="text-sm leading-relaxed">{c.message}</p>
                    </div>
                  </div>
                 )
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-red-900/30 bg-black/80 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Lời trăn trối..."
                className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-red-700 focus:ring-1 focus:ring-red-900 transition-all text-gray-200 placeholder:text-gray-600"
              />
              <button
                onClick={handleSendChat}
                className="bg-[#7f1d1d] text-white px-5 rounded-xl border border-red-900 hover:bg-red-800 transition-colors font-bold"
              >
                Gửi
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center">
            <Loading textMsg="Đang hiến tế..." />
          </div>
        )}
      </div>

      {/* Style Scrollbar riêng cho trang này */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #450a0a; border-radius: 10px; }
      `}</style>
    </div>
  );
}