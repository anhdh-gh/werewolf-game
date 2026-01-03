"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import { API_PATHS } from "@/constants/paths.api";
import { apiFetch } from "@/utils/apiClient";

export default function MainContent() {
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);

  /* ================= MAX PLAYERS VALIDATION ================= */
  const handleMaxPlayersChange = (e) => {
    let value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    if (value === "") {
      setMaxPlayers("");
      return;
    }

    value = Number(value);
    if (value < 5) value = 5;
    if (value > 99) value = 99;

    setMaxPlayers(value);
  };

  /* ================= CREATE ROOM ================= */
  const handleCreateRoom = async () => {
    if (!maxPlayers || maxPlayers < 5 || maxPlayers >= 100) {
      return alert("Số người chơi phải > 4 và < 100");
    }

    setLoadingCreate(true);
    try {
      const res = await apiFetch(API_PATHS.ROOM_CREATE, {
        method: "POST",
        body: JSON.stringify({
          room: {
            max_players: Number(maxPlayers),
          },
        }),
      });

      const code = res?.data?.room?.code;
      if (code) {
        router.push(PATHS.ROOM + "/" + code);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể tạo phòng");
    } finally {
      setLoadingCreate(false);
    }
  };

  /* ================= JOIN ROOM ================= */
  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      return alert("Vui lòng nhập mã phòng");
    }

    setLoadingJoin(true);
    try {
      const res = await apiFetch(API_PATHS.ROOM_JOIN, {
        method: "POST",
        body: JSON.stringify({
          room: {
            code: roomCode.trim(),
          },
        }),
      });

      const code = res?.data?.room?.code;
      if (code) {
        router.push(PATHS.ROOM + "/" + code);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể vào phòng");
    } finally {
      setLoadingJoin(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#0b0b12] via-[#0f0f1a] to-black px-4 py-10 gap-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400">
        {`Xin chào ${localStorage.getItem(KEYS.USERNAME) || "Player"}!`}
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* ================= CREATE ROOM ================= */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white/60 flex items-center gap-1">
            👥 Tạo phòng: Số người chơi (4 – 99)
          </span>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={maxPlayers}
              onChange={handleMaxPlayersChange}
              onBlur={() => {
                if (!maxPlayers || maxPlayers < 4) setMaxPlayers(4);
              }}
              className="
                w-full
                p-3
                rounded-xl
                bg-white/10
                border
                border-white/20
                text-white
                text-center
                focus:outline-none
                focus:border-red-500
              "
            />

            <button
              onClick={handleCreateRoom}
              disabled={loadingCreate}
              className="
                w-full sm:w-28
                py-3
                rounded-xl
                bg-red-500
                hover:bg-red-600
                text-white
                font-semibold
                disabled:opacity-50
              "
            >
              {loadingCreate ? "..." : "Create"}
            </button>
          </div>
        </div>

        {/* ================= JOIN ROOM ================= */}
        <div className="flex flex-col gap-1">
          <span className="text-sm text-white/60 flex items-center gap-1">
            🔑 Vào phòng:
          </span>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Nhập ID phòng"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="
                w-full
                p-3
                rounded-xl
                bg-white/10
                border
                border-white/20
                text-white
                placeholder-white/60
                focus:outline-none
                focus:border-purple-500
              "
            />

            <button
              onClick={handleJoinRoom}
              disabled={loadingJoin}
              className="
                w-full sm:w-28
                py-3
                rounded-xl
                bg-purple-500
                hover:bg-purple-600
                text-white
                font-semibold
                disabled:opacity-50
              "
            >
              {loadingJoin ? "..." : "Join"}
            </button>
          </div>
        </div>

        {/* ================= OTHER ACTIONS ================= */}
        <div className="flex flex-col gap-3 pt-6 border-t border-white/10">
          <span className="text-sm text-white/50 flex items-center gap-1">
            ⚙️ Other actions
          </span>

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
      </div>
    </main>
  );
}
