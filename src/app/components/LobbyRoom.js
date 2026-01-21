"use client";

import { useEffect, useState, useRef } from "react";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { useRoom } from "@/contexts/RoomContext";
import Loading from "@/components/Loading";
import { PATHS } from "@/constants/paths";
import { useRouter } from "next/navigation";
import Image from "next/image";
import localFont from "next/font/local";

const fontHorror = localFont({
  
  src: "../../../public/fonts/Fz-Gypsy-Curse.ttf", 
  display: "swap",
});



export default function LobbyRoom({ roomCode }) {
  const socket = getGameSocket();
  const router = useRouter();

  const { players, setPlayers } = useRoom();
  const [room, setRoom] = useState(null);

  // Đã xóa state username và useEffect lấy username

  const [loadingReady, setLoadingReady] = useState(false);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchedPlayersRef = useRef(false);

  /* ===== LOAD ROOM INFO ===== */
  useEffect(() => {
    if (!socket) return;

    socket.emit(
      EVENTS.ROOM_INFO,
      { room: { code: roomCode } },
      (res) => {
        if (res?.code === 200) {
          setRoom(res.data.room);
        } else {
          console.error("❌ ROOM_INFO FAIL:", res);
          router.push(PATHS.HOME);
        }
      }
    );
  }, [roomCode, socket]);

  /* ===== LOAD PLAYERS IF EMPTY ===== */
  useEffect(() => {
    if (!socket) return;
    if ((!players || players.length === 0) && !fetchedPlayersRef.current) {
      fetchedPlayersRef.current = true;
      socket.emit(
        EVENTS.PLAYER_INFO,
        { room: { code: roomCode } },
        (res) => {
          if (res?.data?.players) {
            setPlayers(res.data.players);
          }
        }
      );
    }
  }, [players, roomCode, socket, setPlayers]);

  /* ===== ACTIONS ===== */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReady = () => {
    if (loadingReady) return;
    setLoadingReady(true);
    socket.emit(EVENTS.PLAYER_READY, { room: { code: roomCode } }, () => {
      setLoadingReady(false);
    });
  };

  const handleLeave = () => {
    if (loadingLeave) return;
    setLoadingLeave(true);
    socket.emit(EVENTS.LEAVE_ROOM, { room: { code: roomCode } }, () => {
      setLoadingLeave(false);
    });
  };

  if (!room) return <Loading />;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black text-red-100 flex flex-col">
      
      {/* 2. BACKGROUND & OVERLAY */}
      <div className="absolute inset-0 z-0">
         <Image
            src="/image/room_screen.jpg" 
            alt="Lobby Background"
            fill
            priority
            className="object-cover object-center opacity-100 contrast-100 brightness-100" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/90 z-10" />
      </div>

      {/* 3. CONTENT CONTAINER */}
      <div className="relative z-20 w-full h-full flex flex-col max-w-2xl mx-auto min-h-screen p-4">

        {/* ===== HEADER (ROOM CODE ONLY) ===== */}
        <header className="w-full flex flex-col items-center gap-4 py-6 border-b border-red-900/30">
          <p className={`${fontHorror.className} text-xl text-red-500/80 tracking-[0.2em]`}>
            PHÒNG CHỜ
          </p>
          
          {/* Khu vực Click to Copy */}
          <div 
            onClick={handleCopy}
            className="group cursor-pointer flex flex-col items-center gap-1 transition-transform active:scale-95"
            title="Chạm để sao chép mã"
          >
              {/* Đã xóa Username ở đây */}

              {/* MÃ PHÒNG + ICON COPY */}
              <div className="flex items-center gap-4 bg-red-950/20 px-6 py-2 rounded-xl border border-red-900/20 hover:bg-red-900/30 hover:border-red-500/50 transition-all duration-300 shadow-lg">
                  
                  {/* Mã số phòng */}
                  <h1 className={`${fontHorror.className} text-6xl text-[#ce2029] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] tracking-widest`}>
                    {roomCode}
                  </h1>

                  {/* Icon Copy */}
                  <div className="relative flex items-center justify-center w-8 h-8">
                    {copied ? (
                       // Icon Check (Màu xanh)
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                       </svg>
                    ) : (
                       // Icon Copy (Màu đỏ tối -> sáng khi hover)
                       <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-800/80 group-hover:text-red-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                         <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                       </svg>
                    )}
                  </div>
              </div>
              
              {/* Text nhỏ báo hiệu đã copy */}
              <span className={`text-xs font-mono font-bold text-green-500 transition-opacity duration-300 ${copied ? "opacity-100" : "opacity-0"}`}>
                 ĐÃ COPY MÃ PHÒNG
              </span>
          </div>

          <div className={`${fontHorror.className} flex items-center justify-between w-full mt-2 px-4`}>
              <div className="flex items-center gap-2 text-xl text-gray-400">
                <span>👥</span>
                <span>{players?.length || 0} / {room.max_players} LINH HỒN</span>
              </div>
              <div className="text-xl text-red-500 tracking-widest uppercase drop-shadow-md">
                {room.status === 'WAITING' ? 'ĐANG ĐỢI...' : room.status}
              </div>
          </div>
        </header>

        {/* ===== BODY (PLAYER LIST) ===== */}
        <main className="flex-1 overflow-y-auto py-6 px-2 space-y-4 no-scrollbar">
          {!players || players.length === 0 ? (
            <div className="text-center mt-20 opacity-40">
               <p className={`${fontHorror.className} text-3xl text-gray-500`}>Chưa có ai ở đây...</p>
            </div>
          ) : (
            players.map((p) => {
              // Logic màu sắc trạng thái
              let statusText = "ĐANG CHUẨN BỊ";
              let statusColor = "text-yellow-600";
              let boxBorder = "border-red-900/20";
              let boxBg = "bg-black/40";

              if (!p.is_connected) {
                statusText = "MẤT KẾT NỐI";
                statusColor = "text-gray-600";
                boxBg = "bg-black/20 grayscale";
              } else if (p.is_ready) {
                statusText = "SẴN SÀNG";
                statusColor = "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]";
                boxBorder = "border-green-900/40";
                boxBg = "bg-green-950/10";
              }

              return (
                <div
                  key={p.player_id}
                  className={`flex items-center justify-between rounded-xl px-5 py-4 border-2 backdrop-blur-md transition-all duration-300 ${boxBg} ${boxBorder}`}
                >
                  <div className="flex flex-col gap-1">
                    {/* Username - Horror Font */}
                    <span className={`${fontHorror.className} text-2xl text-red-100 tracking-wide`}>
                       {p.username}
                    </span>
                    
                    {/* ID: Màu trắng, Đậm */}
                    <span className="text-xs text-white/90 font-mono font-bold tracking-wider">
                       ID: {String(p.player_id || "").substring(0, 8)}
                    </span>
                    
                  </div>

                  {/* Status Badge */}
                  <div className={`${fontHorror.className} text-xl tracking-widest ${statusColor}`}>
                    {statusText}
                  </div>
                </div>
              );
            })
          )}
        </main>

        {/* ===== FOOTER (BUTTONS) ===== */}
        <footer className="w-full pt-4 pb-6 flex gap-4 mt-auto border-t border-red-900/30">
          {/* Nút Sẵn Sàng */}
          <button
            disabled={loadingReady}
            onClick={handleReady}
            className="flex-1 relative py-4 rounded-xl bg-[#7f1d1d] hover:bg-red-700 border-2 border-red-950 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale group overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]"
          >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <span className={`${fontHorror.className} relative z-10 text-3xl text-white tracking-[0.15em] drop-shadow-md`}>
                {loadingReady ? "..." : "SẴN SÀNG"}
              </span>
              {/* Hiệu ứng giọt máu */}
              {!loadingReady && (
                <div className="absolute top-0 right-4 w-[2px] h-4 bg-red-400/30 group-hover:h-8 transition-all duration-500" />
              )}
          </button>

          {/* Nút Rời Phòng */}
          <button
            disabled={loadingLeave}
            onClick={handleLeave}
            className="w-1/3 py-4 rounded-xl bg-gray-900/80 hover:bg-gray-800 border-2 border-gray-700 text-gray-400 hover:text-red-500 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={`${fontHorror.className} text-2xl tracking-widest`}>
              {loadingLeave ? "..." : "RỜI BỎ"}
            </span>
          </button>
        </footer>
      
      </div>
    </div>
  );
}