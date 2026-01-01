"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";

export default function MainContent() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = () => {
    if (!roomId.trim()) return alert("Vui lòng nhập ID phòng!");
    router.push(PATHS.ROOM + '/' + roomId.trim());
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black px-5 py-10 gap-8">
      <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
        {`Xin chào ${localStorage.getItem(KEYS.USERNAME) || "Player"}!`}
      </h1>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => router.push(PATHS.ROOM)}
          className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          Tạo phòng
        </button>

        {/* Join Room: input + button */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nhập ID phòng"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleJoinRoom}
            className="py-3 px-4 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold"
          >
            Join
          </button>
        </div>

        <button
          onClick={() => router.push(PATHS.SERVER)}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold"
        >
          Chọn lại server
        </button>
        <button
          onClick={() => router.push(PATHS.SIGN_UP)}
          className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold"
        >
          Đăng ký
        </button>
        <button
          onClick={() => router.push(PATHS.SIGN_IN)}
          className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          Đăng nhập
        </button>
      </div>
    </main>
  );
}
