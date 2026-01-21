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

export default function NightWitchKill({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);

 /*===== self-test-start ===== */
  useEffect(() => {
    // 1. CHẾ ĐỘ DEBUG: Lấy dữ liệu từ props 'flow' truyền vào
    if (roomCode === "DEBUG") {
      // Lấy danh sách từ flow.data.players (có sẵn trong UITestPage)
      const mockPlayers = flow?.data?.players || [];
      
      const currentPlayer = mockPlayers.find(p => p.player_id === 1) || FAKE_PLAYER;
       
      
      setPlayer(currentPlayer);
      setPlayersList(mockPlayers.filter(p => p.is_alive && p.is_connected && p.is_ready));
      return;
    }
  
    // 2. CHẾ ĐỘ CHẠY THẬT: Gọi Socket
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

    // Emit lấy danh sách người chơi để hiển thị list soi
    socket.emit(
      EVENTS.PLAYER_INFO, 
      { room: { code: roomCode } }, 
      (res) => {
        if (res?.data?.players) {
          setPlayersList(res.data.players.filter((p) => p.is_alive && p.is_connected && p.is_ready));
        }
      }
    );
  }, [roomCode, router, flow]); // Thêm flow vào dependency để nó cập nhật khi bạn đổi data bên file test
/*===== self-test-end ===== */ 

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

  /* ===== LOGIC POISON ===== */
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
    // Nếu hết bình hoặc đang loading -> chặn
    if (!socket || isLoading || !canPoison) return;

    // Toggle chọn/bỏ chọn
    if (selectedPlayer?.player_id === target.player_id) {
        setSelectedPlayer(null);
        // Có thể cần gửi lên server việc bỏ chọn nếu logic server yêu cầu
        return;
    }

    setSelectedPlayer(target);
    
    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: {
        id: target.player_id,
        username: target.username,
      },
    });
  };

  /* ===== COMPONENTS ===== */
  
  // Wrapper Background chung
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
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-purple-950/30 to-black/90 mix-blend-multiply" />
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
      <header className="shrink-0 pt-6 pb-2 px-4 text-center z-20">
        <h2 className={`${fontHorror.className} text-5xl text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.6)] tracking-widest mb-1 animate-pulse`}>
          BÌNH THUỐC ĐỘC
        </h2>
        <p className="text-purple-300/60 text-xs uppercase tracking-[0.2em] font-bold mb-4">
          Chọn kẻ ngươi muốn loại bỏ
        </p>

        {/* Info Bar */}
        <div className="flex justify-center gap-2 mb-2">
            <span className="bg-purple-950/60 border border-purple-900/50 px-3 py-1 rounded-md text-[10px] text-purple-200 font-bold uppercase shadow-sm backdrop-blur-md">
                Role: {player.role}
            </span>
             <span className="bg-zinc-900/60 border border-zinc-700 px-3 py-1 rounded-md text-[10px] text-gray-400 font-bold uppercase shadow-sm backdrop-blur-md">
                Poison: {player.witch_poison}
            </span>
        </div>
      </header>

      {/* --- BODY: PLAYER LIST --- */}
      <main className="flex-1 overflow-y-auto px-4 pb-32 scrollbar-hide w-full">
        {/* Warning Banner if No Poison */}
        {!canPoison && (
            <div className="mb-4 bg-zinc-900/80 border border-zinc-700 p-4 rounded-xl flex items-center gap-3 backdrop-blur-md">
                <span className="text-2xl">🚫</span>
                <div>
                    <h4 className="text-gray-300 font-bold text-sm uppercase">Hết thuốc độc</h4>
                    <p className="text-gray-500 text-xs">Bạn không thể sử dụng kỹ năng này đêm nay.</p>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {playersList.map((p) => {
            const isSelected = selectedPlayer?.player_id === p.player_id;
            const isSelf = p.player_id === player?.player_id;

            return (
              <div
                key={p.player_id}
                onClick={() => handleVote(p)}
                className={`
                  group relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 overflow-hidden
                  ${!canPoison 
                    ? "opacity-50 grayscale bg-black/40 border-zinc-800 cursor-not-allowed" // Disabled style
                    : isSelected 
                        ? "bg-purple-900/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-[1.02] cursor-pointer" // Selected style
                        : "bg-black/40 border-zinc-800/60 hover:border-purple-700 hover:bg-purple-950/20 cursor-pointer" // Normal style
                  }
                `}
              >
                 {/* Background Glow Effect on Hover/Select */}
                 {(isSelected) && (
                   <div className="absolute inset-0 bg-purple-600/10 z-0 animate-pulse" />
                )}

                {/* Avatar Placeholder */}
                <div className={`relative z-10 w-12 h-12 mb-2 rounded-full flex items-center justify-center text-xl shadow-inner border-2 transition-colors
                    ${isSelected ? "bg-purple-950 border-purple-400 text-purple-200" : "bg-zinc-900 border-zinc-700 text-zinc-500 group-hover:border-purple-800"}
                `}>
                    {p.username.charAt(0).toUpperCase()}
                    
                    {/* Skull overlay if selected */}
                    {isSelected && (
                         <span className="absolute text-2xl inset-0 flex items-center justify-center pointer-events-none drop-shadow-md animate-bounce">
                            ☠️
                         </span>
                    )}
                </div>

                {/* Info */}
                <div className="relative z-10 text-center">
                    <span className={`block ${fontHorror.className} text-xl tracking-wide truncate max-w-[120px] ${isSelected ? "text-purple-100" : "text-gray-300"}`}>
                        {p.username}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                         ID: {p.player_id} {isSelf && "(Bạn)"}
                    </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* --- FOOTER: ACTION BUTTON --- */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-6 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto w-full pointer-events-auto flex flex-col gap-3">
             {/* Info Selection */}
             {hasSelected && (
                <div className="text-center animate-pulse">
                    <span className="text-xs text-purple-400 font-bold uppercase tracking-widest">
                        Mục tiêu: {selectedPlayer.username}
                    </span>
                </div>
            )}

            <button
                disabled={isLoading}
                onClick={handleDone}
                className={`
                    w-full py-4 rounded-2xl border relative overflow-hidden group transition-all duration-300 shadow-xl
                    ${isLoading 
                        ? "bg-zinc-900 border-zinc-700 cursor-not-allowed opacity-50" 
                        : hasSelected 
                            ? "bg-purple-900 border-purple-500 hover:bg-purple-800 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]" // Kill button
                            : "bg-zinc-900/80 border-zinc-600 hover:bg-zinc-800 hover:border-zinc-400" // Skip button
                    }
                `}
            >
                 <span className={`relative z-10 ${fontHorror.className} text-3xl tracking-[0.15em] uppercase ${hasSelected ? "text-white" : "text-gray-400"}`}>
                    {isLoading 
                        ? "Đang niệm chú..." 
                        : hasSelected 
                            ? "GIEO RẮC CÁI CHẾT" 
                            : canPoison ? "BỎ QUA LƯỢT" : "KHÔNG THỂ DÙNG (BỎ QUA)"
                    }
                </span>
                
                {/* Button Shine Effect */}
                {!isLoading && hasSelected && (
                    <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />
                )}
            </button>
        </div>
      </footer>

      {/* --- GLOBAL LOADING OVERLAY --- */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center">
             <Loading textMsg="Đang thực hiện..." />
        </div>
      )}
    </BackgroundWrapper>
  );
}