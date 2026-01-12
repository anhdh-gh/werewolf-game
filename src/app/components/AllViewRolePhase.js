"use client";

import { useEffect, useState, useRef } from "react";
import { EVENTS } from "@/constants/events";
import { getGameSocket } from "@/socket/gameSocket";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Creepster, Nosifer } from "next/font/google";

const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });
const fontBlood = Nosifer({ weight: "400", subsets: ["latin"], display: "swap" });

export default function AllViewRolePhase({ roomCode, flow }) {
  const router = useRouter();
  const [player, setPlayer] = useState();
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef(null);

  /* ===== FETCH PLAYER INFO ===== */
  useEffect(() => {
    const socket = getGameSocket();
    if (!socket) return;
    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
    };

    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode }, player: { ids: [playerId] } }, (res) => {
      if (!res?.data?.players?.length) return;
      setPlayer(res.data.players[0]);
    });
  }, [roomCode, router]);

  /* ===== TTS LOGIC ===== */
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
        console.log("Đang đọc: ", flow.message);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Audio bị ngắt (bình thường):", err.message);
        } else {
          console.error("Lỗi Audio:", err);
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

  const handleFlip = () => {
    setRevealed(!revealed);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  if (!player) {
    return <Loading textMsg="Đang triệu hồi linh hồn..." />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center px-4 gap-8">
      
      {/* === BACKGROUND LAYER (ĐÃ BỎ OVERLAY) === */}
      <Image
        src="/image/select_server_screen.jpg"
        alt="Role Reveal Background"
        fill
        priority
        // Tăng opacity lên một chút vì không còn lớp phủ làm tối
        className="object-cover opacity-80 contrast-125 saturate-50"
      />
      
      {/* (ĐÃ XÓA DIV OVERLAY Ở ĐÂY) */}

      {/* === CONTENT LAYER === */}
      <div className="relative z-20 flex flex-col items-center gap-10 w-full max-w-md">
        
        {/* MESSAGE HEADER */}
        <div className="text-center space-y-2">
            <h2 className={`${fontHorror.className} text-3xl sm:text-4xl text-red-100 drop-shadow-[0_2px_10px_rgba(220,38,38,0.8)] tracking-widest animate-pulse`}>
                LỜI NHẮN TỪ BÓNG TỐI
            </h2>
            {/* Thêm nền đen mờ cho text dễ đọc hơn vì đã bỏ overlay toàn màn hình */}
            <p className="text-gray-200 italic font-medium bg-black/60 px-4 py-2 rounded-lg border border-white/10 backdrop-blur-sm">
                "{flow.message}"
            </p>
        </div>

        {/* CARD CONTAINER */}
        <div className="relative w-64 h-96 group perspective">
            <div
                onClick={handleFlip}
                className={`relative w-full h-full duration-700 preserve-3d cursor-pointer transition-transform ${revealed ? "rotate-y-180" : ""}`}
            >
                {/* --- MẶT SAU --- */}
                <div className="absolute inset-0 backface-hidden rounded-2xl bg-[#1a0505] border-4 border-[#3f0e0e] shadow-[0_0_30px_rgba(0,0,0,1)] flex flex-col items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')]"></div>
                    <div className="w-[90%] h-[90%] border border-red-900/30 rounded-xl flex items-center justify-center relative bg-black/40">
                        <span className={`${fontBlood.className} text-4xl text-red-700/80 drop-shadow-md text-center`}>
                            YOUR<br/>FATE
                        </span>
                    </div>
                    <p className={`${fontHorror.className} absolute bottom-4 text-gray-400 text-sm tracking-widest animate-bounce`}>
                        CHẠM ĐỂ MỞ
                    </p>
                </div>

                {/* --- MẶT TRƯỚC --- */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-[#0a0a0a] border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] flex flex-col items-center justify-between p-6 overflow-hidden">
                    
                    <div className="text-center">
                        <span className={`${fontHorror.className} text-gray-400 text-xl tracking-widest block mb-1`}>
                            VAI TRÒ
                        </span>
                        <div className="h-[1px] w-12 bg-red-600 mx-auto"></div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                            {player.initial_role.toLowerCase().includes('wolf') ? '🐺' : '👤'}
                        </div>
                        <h1 className={`${fontBlood.className} text-3xl text-red-500 text-center drop-shadow-[0_2px_2px_black] uppercase leading-relaxed break-words`}>
                            {player.initial_role}
                        </h1>
                    </div>

                    <div className="text-center bg-black/60 w-full py-2 rounded-lg border border-red-900/30">
                         <p className="text-xs text-red-400/60 uppercase font-bold tracking-widest">
                            ID: {player.player_id}
                        </p>
                        <p className={`${fontHorror.className} text-lg text-white/90`}>
                            {player.username}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* INSTRUCTION TEXT - Thêm nền mờ để không bị chìm vào background */}
        <p className={`${fontHorror.className} text-gray-300 text-lg tracking-widest bg-black/40 px-3 py-1 rounded-full`}>
            {revealed ? "--- HÃY GIỮ BÍ MẬT ---" : "--- SỐ PHẬN ĐÃ ĐỊNH ---"}
        </p>

      </div>

      <style jsx global>{`
        .perspective { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}