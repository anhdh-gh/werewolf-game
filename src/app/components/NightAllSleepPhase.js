"use client";

import { useEffect, useRef } from "react";
import Loading from "@/components/Loading";
import Image from "next/image";
import localFont from "next/font/local";




// Font Ma Mị
const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});

export default function NightAllSleepPhase({ roomCode, flow }) {
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
        src="/image/select_server_screen.jpg"
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
          
        <h2 className={`${fontHorror.className} text-4xl sm:text-5xl text-red-500/90 tracking-widest animate-pulse`}>
  ĐÊM TRƯỜNG
</h2>
          
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
        <p className={`${fontHorror.className} text-red-500/90 text-xl tracking-widest uppercase py-2 bg-transparent`}>
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