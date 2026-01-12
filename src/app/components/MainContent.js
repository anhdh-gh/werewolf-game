"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Creepster } from "next/font/google";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { useApiFetch } from "@/hooks/useApiFetch";

const fontHorror = Creepster({ weight: "400", subsets: ["latin"], display: "swap" });

export default function MainContent() {
  const router = useRouter();
  const apiFetch = useApiFetch();

  const [username, setUsername] = useState("Player");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem(KEYS.USERNAME);
    if (name) setUsername(name);
  }, []);

  const handleMaxPlayersChange = (e) => {
    let value = e.target.value;
    if (!/^\d*$/.test(value)) return;
    if (value === "") {
      setMaxPlayers("");
      return;
    }
    let num = Number(value);
    if (num > 99) num = 99;
    setMaxPlayers(num);
  };

  const handleCreateRoom = async () => {
    if (!maxPlayers || maxPlayers < 4 || maxPlayers >= 100) {
      alert("Số người chơi phải > 4 và < 100");
      return;
    }
    setLoadingCreate(true);
    try {
      const res = await apiFetch(API_PATHS.ROOM_CREATE, {
        method: "POST",
        body: JSON.stringify({ room: { max_players: Number(maxPlayers) } }),
      });
      const code = res?.data?.room?.code;
      if (code) router.push(`${PATHS.ROOM}/${code}`);
    } catch (err) {
      console.error(err);
      alert("Không thể tạo phòng");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      alert("Vui lòng nhập mã phòng");
      return;
    }
    setLoadingJoin(true);
    try {
      const res = await apiFetch(API_PATHS.ROOM_JOIN, {
        method: "POST",
        body: JSON.stringify({ room: { code: roomCode.trim() } }),
      });
      const code = res?.data?.room?.code;
      if (code) router.push(`${PATHS.ROOM}/${code}`);
    } catch (err) {
      console.error(err);
      alert("Không thể vào phòng");
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/signin");
  };

  return (
   <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4 py-10">
      
      {/* Background Image - Đảm bảo hiện rõ 100% */}
      <Image
        src="/image/lobby_screen.png"
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-100 contrast-125 saturate-110" // Tăng độ tương phản và màu sắc cho ảnh nổi bật
      />
      
      {/* Overlay - Đã làm mờ lớp này đi để không bị đen quá */}
      <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" />

      {/* Main Content Box */}
      <div className="w-full max-w-md flex flex-col items-center gap-6 relative z-20">
        
        {/* Header Section - Thêm Shadow cực đậm để nổi trên nền ảnh rõ */}
        <div className="text-center space-y-2 mb-4 drop-shadow-[0_0_15px_rgba(0,0,0,1)]">
            <h1 className={`${fontHorror.className} text-5xl text-[#ce2029] tracking-widest`}>
                XIN CHÀO
            </h1>
            <p className={`${fontHorror.className} text-white text-3xl tracking-wide`}>
                {username}
            </p>
        </div>

        {/* Form Container - CHỈNH TRONG SUỐT HƠN Ở ĐÂY */}
        <div className="w-full bg-black/80 border border-red-900/30 rounded-3xl p-6 sm:p-8 flex flex-col gap-8 shadow-[0_0_40px_rgba(0,0,0,0.8)]">
          
          {/* === CREATE ROOM === */}
          <div className="flex flex-col gap-2" >
             <label className={`${fontHorror.className} text-2xl text-red-500 tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ml-1`}>
               🩸 NGHI THỨC TẠO
             </label>

             <div className="flex items-stretch gap-3 h-16">
                <div className="relative flex-1 group">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxPlayers}
                    onChange={handleMaxPlayersChange}
                    className={`${fontHorror.className} w-full h-full pl-4 pr-20 bg-black/60 border-2 border-red-900/50 text-red-100 rounded-xl outline-none text-4xl focus:border-red-600 focus:shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-all text-center`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-600/60 text-xs font-bold font-sans uppercase tracking-widest pointer-events-none">
                    Players
                  </span>
                </div>

                <button
                  onClick={handleCreateRoom}
                  className="h-full px-6 bg-red-900/80 hover:bg-red-700 border-2 border-red-950 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center min-w-[100px]"
                >
                   <span className={`${fontHorror.className} text-3xl text-white tracking-widest`}>TẠO</span>
                </button>
             </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-red-900/60 to-transparent" />

          {/* === JOIN ROOM === */}
          <div className="flex flex-col gap-2">
             <label className={`${fontHorror.className} text-2xl text-gray-400 tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,1)] ml-1`}>
               💀 XÂM NHẬP
             </label>

             <div className="flex items-stretch gap-3 h-16">
                <input
                  type="text"
                  placeholder="MÃ SỐ"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  className={`${fontHorror.className} flex-1 min-w-0 h-full px-4 bg-black/60 border-2 border-gray-800 text-gray-200 placeholder-gray-700 rounded-xl outline-none text-2xl focus:border-red-500 transition-all text-center uppercase tracking-widest`}
                />

                <button
                  onClick={handleJoinRoom}
                  className="h-full px-6 bg-gray-900/80 hover:bg-gray-800 border-2 border-gray-700 rounded-xl transition-all flex items-center justify-center min-w-[100px]"
                >
                   <span className={`${fontHorror.className} text-3xl text-gray-400 tracking-widest`}>VÀO</span>
                </button>
             </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col items-center gap-2 mt-2 w-full drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
           <button
             onClick={() => router.push(PATHS.SERVER)}
             className={`${fontHorror.className} text-xl text-red-600 hover:text-red-400 transition-colors tracking-widest uppercase py-2`}
           >
             Quay lại chọn vùng đất 
           </button>

           <button 
             onClick={handleLogout} 
             className={`${fontHorror.className} text-lg text-gray-500 hover:text-white transition-colors tracking-widest uppercase`}
           >
               Đăng xuất 
           </button>
        </div>
      </div>
    </div>
  );
}