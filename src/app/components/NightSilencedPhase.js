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

export default function NightSilencedPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);
  const [showRole, setShowRole] = useState(false);


 useKeepScreenOn(); 
  /*===== self-test-start ===== */
  useEffect(() => {
    // 1. CHẾ ĐỘ DEBUG
    if (roomCode === "DEBUG") {
      const mockPlayers = flow?.data?.players || [];
      const currentPlayer = mockPlayers.find(p => p.player_id === 1) || {};
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
  
    // Emit lấy thông tin bản thân
    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (res?.data?.players?.length) {
          setPlayer(res.data.players[0]);
        }
      }
    );

    // Emit lấy danh sách
    socket.emit(
      EVENTS.PLAYER_INFO, 
      { room: { code: roomCode } }, 
      (res) => {
        if (res?.data?.players) {
          setPlayersList(res.data.players.filter((p) => p.is_alive && p.is_connected && p.is_ready));
        }
      }
    );
  }, [roomCode, router, flow]); 
/*===== self-test-end ===== */ 

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
        if (res?.data?.players?.length) {
          setPlayer(res.data.players[0]);
        }
      }
    );

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

  /* ===== ACTIONS ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;
    setIsLoading(true);
    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const handleSilence = (p) => {
    if (!socket || isLoading) return;
    
    // Toggle chọn/bỏ chọn
    if (selectedPlayer?.player_id === p.player_id) {
        setSelectedPlayer(null);
        return;
    }

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

  const handleShowRole = () =>{
    setShowRole(!showRole);
  }
  /* ===== COMPONENTS ===== */
  const BackgroundWrapper = ({ children }) => (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-gray-200 font-sans selection:bg-purple-900 selection:text-white">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/image/room_screen.jpg"
          alt="Night Background"
          fill
          priority
          className="object-cover opacity-60 contrast-125 brightness-75 grayscale-[0.3]"
        />
        {/* Lớp phủ Tím/Chàm (Indigo) cho sự im lặng */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-indigo-950/20 to-black/90 mix-blend-multiply" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full min-h-screen max-w-md mx-auto bg-black/20 backdrop-blur-[2px]">
        {children}
      </div>
    </div>
  );

  /* ===== LOADING STATE ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  const roleNameVN = player.role ? ROLE_NAME_VN[player.role] : ROLE_NAME_VN.DEFAULT;

  /* ===== CHECK PERMISSION ===== */
  const isSilencerWakeup =
    player.role === ROLES.SILENCED && 
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const hasSelected = !!selectedPlayer;

  /* ===== VIEW: PASSIVE ===== */
  if (!isSilencerWakeup) {
    return (
      <BackgroundWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-8 animate-in fade-in duration-1000">
          <div className="relative drop-shadow-[0_0_15px_rgba(129,140,248,0.3)]">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 tracking-widest leading-tight`}>
               {flow.message}
            </h2>
          </div>
           <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
            <p className="text-xs text-gray-400 font-sans tracking-widest uppercase" onClick={handleShowRole}>
              Vai trò của bạn : {showRole ? roleNameVN : "*************"}
            </p>
          </div>
        </div>
      </BackgroundWrapper>
    );
  }

  /* ===== VIEW: ACTIVE SILENCER ===== */
  return (
    <BackgroundWrapper>
      {/* --- HEADER --- */}
      <header className="shrink-0 p-4 pt-6 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-5xl md:text-6xl text-indigo-400 tracking-widest mb-2 leading-none drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]`}>
          Ai phải im lặng?
        </h2>
        <div className="flex justify-center gap-3">
          <span className="text-xs text-gray-400 font-sans tracking-widest uppercase" onClick={handleShowRole}>
            vai trò của bạn là : {roleNameVN}
          </span>
        </div>
      </header>

      {/* --- BODY: LIST & BUTTON --- */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-hide w-full flex flex-col items-center">
        
        {/* Tăng khoảng cách giữa các item (space-y-4) */}
        <div className="w-full space-y-4"> 
            
            {/* Chữ CHỌN MỤC TIÊU chuyển thành màu ĐỎ */}
            <h3 className={`${fontHorror.className} text-center text-red-500 text-3xl uppercase tracking-widest mb-4 drop-shadow-[0_2px_4px_black]`}>
                CHỌN MỤC TIÊU 
            </h3>

            {playersList.map((p) => {
                const isSelected = selectedPlayer?.player_id === p.player_id;
                const isSelf = p.player_id === player?.player_id;

                return (
                <div
                    key={p.player_id}
                    onClick={() => handleSilence(p)}
                    // BỎ VIỀN (border), chỉ giữ hiệu ứng nền
                    className={`group w-full flex items-center justify-between rounded-xl px-5 py-4 transition-all shadow-lg active:scale-95 backdrop-blur-sm
                        ${isSelected 
                            ? "bg-indigo-900/60 shadow-[0_0_15px_rgba(99,102,241,0.4)] cursor-pointer" // Selected (No border)
                            : "bg-black/70 hover:bg-indigo-950/60 cursor-pointer" // Normal (No border)
                        }
                    `}
                >
                    {/* Name Top, ID Bottom */}
                    <div className="flex flex-col items-start relative z-10">
                        <span
                            className={`${fontHorror.className} text-2xl tracking-wide ${
                            isSelected
                                ? "text-indigo-100"
                                : "text-gray-200 group-hover:text-indigo-100"
                            }`}
                        >
                            {p.username}
                        </span>
                        <span
                            className={`text-xs font-sans font-bold ${
                            isSelected ? "text-indigo-300" : "text-gray-500"
                            }`}
                        >
                            ID: {p.player_id} {isSelf && "(Bạn)"}
                        </span>
                    </div>

                    {/* Status Icon */}
                    <div className="flex flex-col items-end relative z-10">
                        {isSelected ? (
                            <span className={`${fontHorror.className} text-2xl text-indigo-400 animate-pulse`}>
                            CÂM LẶNG
                            </span>
                        ) : (
                            <span className="text-2xl opacity-60 grayscale group-hover:grayscale-0 transition-all">🤐</span>
                        )}
                    </div>

                    {/* Pulse Animation */}
                    {!isSelected && <div className="absolute inset-0 bg-indigo-900/5 animate-[pulse_3s_ease-in-out_infinite] rounded-xl z-0" />}
                </div>
                );
            })}

            {/* --- BUTTON SECTION --- */}
            <div className="pt-8 pb-4">
                {hasSelected && (
                    <div className="text-center animate-bounce mb-2">
                        <span className="text-xs text-indigo-400 font-bold uppercase tracking-widest">
                            Mục tiêu: {selectedPlayer.username}
                        </span>
                    </div>
                )}

                <button
                    disabled={isLoading}
                    onClick={handleDone}
                    className={`w-full py-4 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)]
                        ${isLoading 
                            ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed" 
                            : hasSelected 
                                ? "bg-indigo-900/80 border-indigo-500 text-white hover:bg-indigo-800 hover:shadow-[0_0_20px_rgba(99,102,241,0.6)]" // Action
                                : "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white" // Skip
                        }
                    `}
                >
                    <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                        {isLoading 
                            ? "Đang niệm chú..." 
                            : hasSelected 
                                ? "LÀM CÂM" 
                                : "BỎ QUA"
                        }
                    </span>
                </button>
            </div>
        </div>
      </main>

      {/* --- GLOBAL LOADING OVERLAY --- */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-black/95 backdrop-blur-xl flex items-center justify-center">
             <Loading textMsg="Đang thực hiện..." />
        </div>
      )}
    </BackgroundWrapper>
  );
}