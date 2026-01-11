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

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4 py-10">
      
      {/* Background Image */}
      <Image
        src="/image/select_server.png"
        alt="Horror Background"
        fill
        priority
        className="object-cover opacity-100 contrast-100 saturate-100"
      />
      
      {/* Overlay: Giảm độ tối đi một chút để nền sáng hơn */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/60 z-10 pointer-events-none" />

      {/* Main Content */}
      <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-20 animate-in fade-in zoom-in duration-500">
        
        {/* Title: Làm chữ to và sáng hơn */}
        <h1 className={`${fontHorror.className} text-4xl sm:text-6xl text-[#ff0000] drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-widest text-center`}>
           XIN CHÀO<br/>
           <span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{username}</span>
        </h1>

        {/* Container */}
        <div className="w-full bg-[#0a0000]/90 border-2 border-[#ff0000] backdrop-blur-md rounded-xl p-6 flex flex-col gap-8 shadow-[0_0_50px_rgba(255,0,0,0.2)]">
          
          {/* ================= CREATE ROOM ================= */}
          <div className="flex flex-col gap-3">
             <span className={`${fontHorror.className} text-2xl text-red-100 tracking-wider flex items-center gap-2 drop-shadow-md`}>
               🩸 NGHI THỨC TẠO PHÒNG
             </span>

             <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxPlayers}
                    onChange={handleMaxPlayersChange}
                    onBlur={() => { if (!maxPlayers || maxPlayers < 4) setMaxPlayers(4); }}
                    placeholder="SL..."
                    // Input: Chữ trắng, nền đỏ đen đậm
                    className={`${fontHorror.className} w-full p-4 bg-[#2a0505] border-2 border-red-500/50 text-white placeholder-red-300 rounded-xl outline-none text-center text-3xl focus:border-red-500 focus:bg-black focus:shadow-[0_0_20px_#ff0000] transition-all`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm font-bold font-mono uppercase">Người</span>
                </div>

                <button
                  onClick={handleCreateRoom}
                  disabled={loadingCreate}
                  // Button TẠO: Màu đỏ tươi hơn, chữ trắng to
                  className="w-36 relative group overflow-hidden rounded-xl border-2 border-[#ff0000] bg-[#7f1d1d] hover:bg-[#b91c1c] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(255,0,0,0.4)]"
                >
                   <span className={`${fontHorror.className} relative z-10 text-3xl text-white tracking-widest drop-shadow-md`}>
                     {loadingCreate ? "..." : "TẠO"}
                   </span>
                   {/* Giọt máu sáng hơn */}
                   {!loadingCreate && <div className="absolute top-0 left-1/2 w-[2px] h-4 bg-red-400 group-hover:h-8 transition-all duration-300" />}
                </button>
             </div>
          </div>

          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />

          {/* ================= JOIN ROOM ================= */}
          <div className="flex flex-col gap-3">
             <span className={`${fontHorror.className} text-2xl text-purple-200 tracking-wider flex items-center gap-2 drop-shadow-md`}>
               🗝️ XÂM NHẬP PHÒNG
             </span>

             <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="MÃ SỐ..."
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  // Input: Chữ trắng, viền tím
                  className={`${fontHorror.className} flex-1 p-4 bg-[#1a051a] border-2 border-purple-500/50 text-white placeholder-purple-300 rounded-xl outline-none text-2xl focus:border-purple-500 focus:bg-black focus:shadow-[0_0_20px_#a855f7] transition-all`}
                />

                <button
                  onClick={handleJoinRoom}
                  disabled={loadingJoin}
                  // Button VÀO: Màu tím sáng
                  className="w-36 relative group overflow-hidden rounded-xl border-2 border-purple-500 bg-[#581c87] hover:bg-[#7e22ce] transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                >
                   <span className={`${fontHorror.className} relative z-10 text-3xl text-white tracking-widest drop-shadow-md`}>
                     {loadingJoin ? "..." : "VÀO"}
                   </span>
                </button>
             </div>
          </div>
        </div>

        {/* ================= OTHER ACTIONS ================= */}
        <div className="w-full flex flex-col gap-4 bg-black/60 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
          <div className="text-center">
             <span className="text-white/80 text-sm font-bold font-mono tracking-[0.3em] uppercase border-b border-white/20 pb-1">
               Lựa chọn khác
             </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
             <button
               onClick={() => router.push(PATHS.SERVER)}
               className={`${fontHorror.className} text-xl text-red-400 hover:text-white transition-colors tracking-widest hover:drop-shadow-[0_0_8px_red]`}
             >
               [ ĐỔI VÙNG ĐẤT ]
             </button>

             <button
               onClick={() => router.push(PATHS.SIGN_UP)}
               className={`${fontHorror.className} text-xl text-green-400 hover:text-white transition-colors tracking-widest hover:drop-shadow-[0_0_8px_green]`}
             >
               [ ĐĂNG KÝ ]
             </button>

             <button
               onClick={() => router.push(PATHS.SIGN_IN)}
               className={`${fontHorror.className} text-xl text-blue-400 hover:text-white transition-colors tracking-widest hover:drop-shadow-[0_0_8px_blue]`}
             >
               [ ĐĂNG NHẬP ]
             </button>
          </div>
        </div>

      </div>
    </div>
  );
}