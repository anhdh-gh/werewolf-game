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
  BODYGUARD: "BẢO VỆ",
  WITCH: "PHÙ THUỶ",
  TANNER: "CHÁN ĐỜI",
  CURSED: "BỊ NGUYỀN",
  SILENCED: "KẺ BỊ CÂM",
  GOD: "HÙNG ANH",
  DEFAULT: "NOTHING",
};

export default function NightWitchKill({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);


 useKeepScreenOn(); 
  /*===== self-test-start ===== */
  useEffect(() => {
    if (roomCode === "DEBUG") {
      const mockPlayers = flow?.data?.players || [];
      const currentPlayer = mockPlayers.find(p => p.player_id === 1) || {};
      setPlayer(currentPlayer);
      setPlayersList(mockPlayers.filter(p => p.is_alive && p.is_connected && p.is_ready));
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
        if (res?.data?.players?.length) {
          setPlayer(res.data.players[0]);
        }
      }
    );

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

  const canPoison = Number(player?.witch_poison) > 0;

  /* ===== ACTIONS ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;
    setIsLoading(true);
    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const handleVote = (target) => {
    if (!socket || isLoading || !canPoison) return;
    if (selectedPlayer?.player_id === target.player_id) {
        setSelectedPlayer(null);
        return;
    }
    setSelectedPlayer(target);
    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: { id: target.player_id, username: target.username },
    });
  };

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
        {/* Lớp phủ Tím ma mị cho Phù Thủy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-purple-950/20 to-black/90 mix-blend-multiply" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full min-h-screen max-w-md mx-auto bg-black/20 backdrop-blur-[2px]">
        {children}
      </div>
    </div>
  );

  /* ===== LOADING STATE ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang pha chế thuốc độc..." />;
  }
  const roleNameVN = player.role ? ROLE_NAME_VN[player.role] : ROLE_NAME_VN.DEFAULT;

  /* ===== CHECK PERMISSION ===== */
  const isWitchWakeup =
    player.role === ROLES.WITCH &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const hasSelected = !!selectedPlayer;

  /* ===== VIEW: PASSIVE ===== */
  if (!isWitchWakeup) {
    return (
      <BackgroundWrapper>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center space-y-8 animate-in fade-in duration-1000">
          <div className="relative drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <h2 className={`${fontHorror.className} text-5xl text-gray-300 tracking-widest leading-tight`}>
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

  /* ===== VIEW: ACTIVE WITCH ===== */
  return (
    <BackgroundWrapper>
      {/* --- HEADER --- */}
      <header className="shrink-0 p-4 pt-6 text-center drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
        <h2 className={`${fontHorror.className} text-5xl md:text-6xl text-purple-500 tracking-widest mb-2 leading-none drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]`}>
          Bạn muốn giết ai?
        </h2>
        <div className="flex justify-center gap-3">
          <span className="text-xs text-gray-400 font-sans tracking-widest uppercase">
            vai trò của bạn là : phù thuỷ | Còn: {player.witch_poison} bình
          </span>
        </div>
      </header>

      {/* --- BODY: PLAYER LIST (UPDATED LAYOUT) --- */}
      <main className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-hide w-full flex flex-col items-center">
        
        {/* Warning Banner if No Poison */}
        {!canPoison && (
            <div className="w-full mb-4 bg-zinc-900/80 border border-zinc-700 p-3 rounded-xl flex items-center justify-center gap-2 backdrop-blur-md">
                <span className="text-xl">🚫</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wide">Đã hết thuốc độc</span>
            </div>
        )}

        <div className="w-full space-y-3">
             <h3 className={`${fontHorror.className} text-3xl text-red-500 mb-4 text-center tracking-wider drop-shadow-[0_2px_2px_black]`}>
                CHỌN MỤC TIÊU
            </h3>

          {playersList.map((p) => {
            const isSelected = selectedPlayer?.player_id === p.player_id;
            const isSelf = p.player_id === player?.player_id;

            return (
              <div
                key={p.player_id}
                onClick={() => handleVote(p)}
                className={`group w-full flex items-center justify-between rounded-xl px-5 py-4 transition-all shadow-lg active:scale-95 backdrop-blur-sm border
                   ${!canPoison 
                      ? "opacity-50 grayscale bg-black/40 border-zinc-800 cursor-not-allowed" 
                      : isSelected
                        ? "bg-purple-900/60 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer" // Selected (Purple)
                        : "bg-black/70 border-purple-900/30 hover:bg-purple-950/60 hover:border-purple-600 cursor-pointer" // Normal
                   }
                `}
              >
                {/* Name Top, ID Bottom */}
                <div className="flex flex-col items-start relative z-10">
                  <span className={`${fontHorror.className} text-2xl tracking-wide ${isSelected ? "text-purple-100" : "text-gray-200 group-hover:text-purple-100"}`}>
                    {p.username}
                  </span>
                  <span className={`text-xs font-sans font-bold ${isSelected ? "text-purple-300" : "text-gray-500"}`}>
                    ID: {p.player_id} {isSelf && "(Bạn)"}
                  </span>
                </div>

                {/* Status Icon */}
                <div className="flex flex-col items-end relative z-10">
                  {isSelected ? (
                    <span className={`${fontHorror.className} text-2xl text-purple-400 animate-pulse`}>
                      MỤC TIÊU
                    </span>
                  ) : (
                    <span className="text-2xl opacity-60 grayscale group-hover:grayscale-0 transition-all">☠️</span>
                  )}
                </div>

                 {/* Pulse Animation */}
                 {!isSelected && <div className="absolute inset-0 bg-purple-900/5 animate-[pulse_3s_ease-in-out_infinite] rounded-xl z-0" />}
              </div>
            );
          })}

          {/* --- BUTTON SECTION (MOVED HERE - END OF LIST) --- */}
          <div className="pt-8 pb-4">
            {hasSelected && (
                <div className="text-center animate-bounce mb-2">
                    <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">
                        Gieo rắc độc lên: {selectedPlayer.username}
                    </span>
                </div>
            )}
            <button
              disabled={isLoading}
              onClick={handleDone}
              className={`w-full py-4 rounded-xl border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.8)] ${
                isLoading
                  ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                  : hasSelected
                    ? "bg-purple-900/80 border-purple-600 text-white hover:bg-purple-700 hover:shadow-[0_0_20px_rgba(168,85,247,0.6)]" // Kill button
                    : "bg-gray-900/80 border-gray-600 text-gray-400 hover:text-white hover:border-white" // Skip button
              }`}
            >
              <span className={`${fontHorror.className} text-3xl tracking-widest uppercase`}>
                {isLoading ? "ĐANG NIỆM CHÚ..." : hasSelected ? "GIEO RẮC CÁI CHẾT" : canPoison ? "BỎ QUA" : "KHÔNG THỂ DÙNG"}
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