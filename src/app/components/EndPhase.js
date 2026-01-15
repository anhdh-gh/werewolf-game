"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import localFont from "next/font/local";
import Loading from "@/components/Loading";
import { useRoom } from "@/contexts/RoomContext";

// --- FONT MA MỊ ---

const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});

export default function EndPhase({ roomCode, flow }) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const { setPlayers, setGameFlow } = useRoom();


  
  useEffect(() => {
    if (!flow?.message) return;

    // ===== PLAY TTS =====
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
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("TTS error:", err?.message);
        }
      }
    };

    playAudio();

    // ===== AUTO BACK TO LOBBY (10s) =====
    timerRef.current = setTimeout(() => {
      setPlayers([]);
      setGameFlow(null);
    }, 10_000);

    // ===== CLEANUP =====
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flow?.message, roomCode, setPlayers, setGameFlow]);

  if (!flow?.message) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loading textMsg="Đang tổng kết..." />
      </div>
    );
  }

  
  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center px-4">
      
      {/* 1. Nền: Dùng lại ảnh cũ nhưng chỉnh màu xám xịt (saturate-0) để tạo cảm giác "Kết thúc/Chết chóc" */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="End Game Background"
        fill
        priority
        className="object-cover opacity-30 contrast-125 saturate-0 pointer-events-none"
      />
      
      {/* 2. Lớp phủ Gradient đen mờ */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/60 to-black pointer-events-none z-0" />

      {/* 3. Nội dung chính */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-10 text-center animate-in fade-in zoom-in duration-1000">
        
        {/* Tiêu đề kết quả */}
        <div className="space-y-4">
            <h2 className={`${fontHorror.className} text-gray-500 text-2xl tracking-[0.5em] opacity-80 uppercase`}>
                KẾT CỤC
            </h2>
            
            {/* Tin nhắn kết quả (flow.message) - Hiệu ứng máu đỏ rực */}
            <h1 className={`${fontHorror.className} text-5xl md:text-7xl text-[#ff0000] drop-shadow-[0_0_30px_rgba(255,0,0,0.6)] leading-tight`}>
                {flow.message}
            </h1>
        </div>

        {/* Decorator Line */}
        <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-red-900 to-transparent" />

        {/* Đồng hồ đếm ngược / Thông báo chuyển trang */}
        <div className="flex flex-col items-center gap-3 opacity-70">
           <div className="w-8 h-8 rounded-full border-2 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
           
           <p className="text-sm font-mono text-gray-400 tracking-wider uppercase animate-pulse">
             Đang tẩy rửa hiện trường...
             <br/>
             <span className="text-[10px] opacity-50 normal-case">
               (Về sảnh sau 10 giây)
             </span>
           </p>
        </div>

      </div>
    </div>
  );
}