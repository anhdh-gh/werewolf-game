"use client";

import { useEffect, useState, useRef } from "react";
import { EVENTS } from "@/constants/events";
import { getGameSocket } from "@/socket/gameSocket";
import { KEYS } from "@/constants/keys";
import Loading from "@/components/Loading";
import { useRouter } from "next/navigation";

export default function AllViewRolePhase({ roomCode, flow }) {
  const router = useRouter();
  const [ player, setPlayer ] = useState();
  const [revealed, setRevealed] = useState(false);
  
  // Dùng Ref để quản lý Audio instance duy nhất
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
  }, [roomCode]);

  /* ===== TTS LOGIC (ĐÃ FIX ABORT ERROR) ===== */
  useEffect(() => {
    if (!flow?.message) return;

    // 1. Nếu chưa có Audio instance thì tạo mới 1 lần thôi
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const playAudio = async () => {
      try {
        // Dừng âm thanh đang đọc dở (nếu có)
        // Lưu ý: Không gọi pause() nếu audio đang trong trạng thái chưa load xong,
        // nhưng gán src mới sẽ tự động stop cái cũ.
        
        // Gọi API Proxy của bạn
        const url = `/api/v1/tts?text=${encodeURIComponent(flow.message)}`;
        
        audio.src = url;
        audio.load(); // Bắt buộc load lại

        // Chờ phát
        await audio.play();
        console.log("Đang đọc: ", flow.message);

      } catch (err) {
        // 🔥 QUAN TRỌNG: Lọc lỗi
        if (err.name === "AbortError") {
          // Lỗi này do người dùng chuyển trang hoặc message đổi nhanh quá
          // => Không phải lỗi nghiêm trọng, bỏ qua.
          console.log("Audio bị ngắt (bình thường):", err.message);
        } else if (err.name === "NotAllowedError") {
          // Lỗi này mới là bị trình duyệt chặn thật
          console.error("Vẫn bị chặn Autoplay, cần click:", err);
        } else {
          console.error("Lỗi Audio khác:", err);
        }
      }
    };

    playAudio();

    // Cleanup: Khi component unmount -> Dừng đọc
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // Không set src = "" để tránh lỗi phụ trên một số trình duyệt
      }
    };
  }, [flow?.message]);

  if (!player) {
    return <Loading textMsg="Đang lấy thông tin vai trò..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
      {/* MESSAGE */}
      <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
        {flow.message}
      </p>

      {/* CARD */}
      <div
        onClick={() => setRevealed(!revealed)}
        className="relative h-64 w-44 cursor-pointer perspective"
      >
        <div className={`absolute inset-0 rounded-xl transition-transform duration-700 preserve-3d ${revealed ? "rotate-y-180" : ""}`}>
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-800 backface-hidden">
            <span className="text-xl font-bold">🐺 Werewolf</span>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-red-700 rotate-y-180 backface-hidden">
            <span className="text-sm opacity-80">Vai trò của bạn</span>
            <span className="mt-2 text-2xl font-bold">{player.initial_role}</span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500">
        {revealed ? "Nhấn để ẩn" : "Nhấn để xem"}
      </p>
      <p className="text-sm text-gray-400">
        {player?.username} (ID: {player?.player_id})
      </p>
    </div>
  );
}