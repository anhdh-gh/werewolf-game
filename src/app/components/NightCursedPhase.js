"use client";

import { useEffect, useRef, useState } from "react";

import Loading from "@/components/Loading";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";
import Image from "next/image";
import localFont from "next/font/local";
import useKeepScreenOn from '../hooks/useKeepScreenOn';



// Font Ma Mị & Máu Me
const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});

export default function NightCursedPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();
  const [player, setPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef(null);


  useKeepScreenOn();

/*===== self-test-start ===== */
  useEffect(() => {
    // 1. CHẾ ĐỘ DEBUG: Lấy dữ liệu từ props 'flow' truyền vào
    if (roomCode === "DEBUG") {
      // Lấy danh sách từ flow.data.players (có sẵn trong UITestPage)
      const mockPlayers = flow?.data?.players || [];
      
      const currentPlayer = mockPlayers.find(p => p.player_id === 1) || FAKE_PLAYER;
       
      
      setPlayer(currentPlayer);
      
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
  BODYGUARD: "BẢO VỆ",
  WITCH: "PHÙ THUỶ",
  TANNER: "CHÁN ĐỜI",
  CURSED: "BỊ NGUYỀN",
  SILENCED: "KẺ BỊ CÂM",
  GOD: "HÙNG ANH",
  DEFAULT: "NOTHING",
};

  /* ===== FETCH SELF PLAYER (GIỮ NGUYÊN LOGIC) ===== */
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

  /* ===== TTS (GIỮ NGUYÊN LOGIC) ===== */
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

  /* ===== DONE (GIỮ NGUYÊN LOGIC) ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;
    setIsLoading(true);
    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  /* ===== INITIAL LOADING ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang triệu hồi..." />;
  }

    const roleNameVN = player.role ? ROLE_NAME_VN[player.role] : ROLE_NAME_VN.DEFAULT;


  const isCursedWakeup =
    player.initial_role === ROLES.CURSED &&
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const isWolfNow = player.role.toLowerCase().includes('wolf');
 

  
  if (!isCursedWakeup) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center px-4 gap-8">
        <Image
          src="/image/select_server_screen.jpg"
          alt="Night Background"
          fill
          priority
          className="object-cover opacity-50 contrast-[1.3] brightness-[0.4] saturate-[1.5] pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-radial from-red-950/20 via-black/80 to-black z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
           <h2 className={`${fontHorror.className} text-4xl text-gray-500 tracking-widest text-center`}>
             {flow.message}
           </h2>
           <div className="bg-black/40 px-6 py-2 rounded-full border border-red-900/30">
            <p className="text-xs text-gray-400 font-sans tracking-widest uppercase">
              Vai trò của bạn : {roleNameVN}
            </p>
          </div>
        </div>
      </div>
    );
  }

 
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center py-6 px-4">
      
      {/* 1. NỀN */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="Cursed Background"
        fill
        priority
        className="object-cover opacity-40 contrast-125 saturate-50 pointer-events-none"
      />
      <div className="absolute inset-0 bg-black/50 pointer-events-none z-0" />

      {/* 2. CONTENT */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-in zoom-in duration-500">
        
        {/* HEADER MESSAGE */}
        <h2 className={`${fontHorror.className} text-2xl text-red-500 drop-shadow-md text-center max-w-xs`}>
            {flow.message}
        </h2>

        {/* --- THẺ BÀI (STYLE MỚI COPY TỪ ALLVIEWROLE) --- */}
        <div className="relative w-72 h-[450px]"> 
           <div className="w-full h-full rounded-2xl bg-[#0a0a0a] border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-between p-6 overflow-hidden">
                
                {/* -- PHẦN TRÊN: TIÊU ĐỀ -- */}
                <div className="text-center w-full mt-2">
                    <span className={`${fontHorror.className} text-gray-400 text-xl tracking-widest block mb-1`}>
                        VAI TRÒ HIỆN TẠI
                    </span>
                    <div className="h-[1px] w-12 bg-red-600 mx-auto"></div>
                </div>

                {/* -- PHẦN GIỮA: ICON & TÊN -- */}
                <div className="flex flex-col items-center gap-4 justify-center flex-1 w-full">
                    {/* Ảnh Sói (Dùng ảnh ngầu thay vì emoji) */}
                    <div className="relative w-22 h-22">
                        {isWolfNow ? (
                            <img 
                                src="\image\werewolf.png" 
                                alt="Werewolf"
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <img 
                                src="/image/villager.png" 
                                alt="Villager"
                                className="w-full h-full object-contain"
                            />
                        )}
                    </div>

                    {/* Tên Role */}
                    <h1 className={`${fontHorror.className} text-3xl text-red-500 text-center drop-shadow-[0_2px_2px_black] uppercase leading-relaxed break-words`}>
                        {roleNameVN}
                    </h1>
                </div>

                {/* -- PHẦN DƯỚI: THÔNG TIN -- */}
                <div className="text-center bg-black/60 w-full py-3 rounded-lg border border-red-900/30">
                     <p className="text-[10px] text-red-400/60 uppercase font-bold tracking-widest mb-1">
                        ID: {player.player_id}
                    </p>
                    <p className={`${fontHorror.className} text-lg text-white/90 truncate px-2`}>
                        {player.username}
                    </p>
                </div>

           </div>
        </div>

        {/* BUTTON */}
        <button
            disabled={isLoading}
            onClick={handleDone}
            className="w-64 py-3 mt-2 rounded-xl bg-red-900/80 border border-red-600 text-red-100 hover:bg-red-800 hover:scale-105 transition-all shadow-lg disabled:opacity-50"
        >
            <span className={`${fontHorror.className} text-xl tracking-widest`}>
                {isLoading ? "..." : "XÁC NHẬN"}
            </span>
        </button>

      </div>

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] w-screen h-[100dvh] bg-black/95 backdrop-blur-xl flex items-center justify-center">
          <Loading textMsg="Đang chuyển hóa..." />
        </div>
      )}
    </div>
  );
}