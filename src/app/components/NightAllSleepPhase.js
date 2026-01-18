"use client";

import { useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Creepster } from "next/font/google";
import { EVENTS } from "@/constants/events";
import { getGameSocket } from "@/socket/gameSocket";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";

// Font Ma Mị
const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });

export default function NightAllSleepPhase({ roomCode, flow }) {
  const router = useRouter();
  const audioRef = useRef(null);
  
  const [player, setPlayer] = useState(null);

  /*===== self-test-start (GIỮ NGUYÊN LOGIC) ===== */
  const FAKE_PLAYER = {
    player_id: 1,
    username: "Fake Player",
    role: "WEREWOLF",
    initial_role: "WEREWOLF",
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

  /* ===== TTS LOGIC (GIỮ NGUYÊN) ===== */
  useEffect(() => {
    if (!flow?.message) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const playAudio = async () => {
      try {
        const url = `/api/v1/tts?text=${encodeURIComponent(flow.message)}`;
        audio.src = url;
        audio.load();
        await audio.play();
        console.log("Đang đọc:", flow.message);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Audio bị ngắt (bình thường):", err.message);
        } else if (err.name === "NotAllowedError") {
          console.error("Vẫn bị chặn Autoplay, cần click:", err);
        } else {
          console.error("Lỗi Audio khác:", err);
        }
      }
    };

    playAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [flow?.message]);

  if (!flow?.message) {
    return <Loading textMsg="Đang tắt đèn..." />;
  }

  /* ===== UI HORROR STYLE (RED THEME) ===== */
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center px-4 gap-8">
      
      {/* 1. NỀN */}
      <Image
        src="/image/night_all_sleep_screen.png"
        alt="Night Background"
        fill
        priority
        // Tăng contrast và giảm brightness để nền tối và đỏ hơn
        className="object-cover opacity-40 contrast-150 brightness-50 saturate-50 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-radial from-black/60 via-black/90 to-black z-0 pointer-events-none" />

      {/* 2. NỘI DUNG CHÍNH */}
      <div className="relative z-10 flex flex-col items-center gap-6 animate-in fade-in duration-1000">
        
        {/* MESSAGE */}
        <div className="text-center space-y-4 max-w-lg">
           {/* 👇 CHỮ ĐỎ KINH DỊ ĐÂY RỒI */}
           <h2 className={`${fontHorror.className} text-4xl sm:text-5xl text-[#ff0000] drop-shadow-[0_0_20px_rgba(255,0,0,0.6)] tracking-widest animate-pulse`}>
             ĐÊM TRƯỜNG
           </h2>
           <p className="text-red-200/80 font-mono text-sm tracking-widest uppercase border-t border-b border-red-900/30 py-2 bg-black/60 backdrop-blur-sm">
             {flow.message}
           </p>
        </div>

        {/* ICON "TRĂNG MÁU" (Đã thu nhỏ w-16 h-16) */}
        <div className="relative w-16 h-16 mt-4">
           <img 
              src="https://cdn-icons-png.flaticon.com/512/702/702471.png"
              alt="Blood Moon"
              className="w-full h-full object-contain animate-bounce-slow"
              style={{
                // Filter biến thành TRĂNG MÁU đỏ lòm
                filter: "brightness(0.6) sepia(1) hue-rotate(-50deg) saturate(400%) drop-shadow(0 0 15px rgba(220, 38, 38, 0.8))"
              }}
           />
           {/* Mây trôi mờ ảo ám đỏ */}
           <div className="absolute bottom-0 left-0 w-full h-1/2 bg-red-950/40 blur-md mix-blend-multiply"></div>
        </div>

        {/* 👇 CHỮ ĐỎ DƯỚI CÙNG */}
        <p className={`${fontHorror.className} mt-2 text-xl text-red-600/80 tracking-widest`}>
           MỌI NGƯỜI ĐANG NGỦ...
        </p>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%); }
          50% { transform: translateY(5%); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}