"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { connectGameSocket, clearGameSocket, disconnectGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { ERRORS } from "@/constants/errors";

export default function RoomContent() {
  const { room_code } = useParams();
  const router = useRouter();

  const [connected, setConnected] = useState(false);

  useEffect(() => {
    /* ===== CONNECT SOCKET ===== */
    const socket = connectGameSocket();
    if (!socket) {
      router.push(PATHS.SERVER);
      return;
    }

    /* ===== ON CONNECT HANDLER ===== */
    const onConnected = () => {
      console.log("✅ SOCKET CONNECTED:", socket.id);
      setConnected(true);

      /* ===== CONNECT ROOM ===== */
      socket.emit(EVENTS.CONNECT_ROOM, {
        room: { code: room_code },
      });

      /* ===== GET ROOM INFO ===== */
      socket.emit(EVENTS.ROOM_INFO, {
        room: { code: room_code },
      });
    };

    // 🔥 quan trọng: socket có thể đã connect sẵn
    if (socket.connected) {
      clearGameSocket()
    } else {
      socket.on(EVENTS.CONNECT, onConnected);
    }

    /* ===== LISTEN GAME EVENTS (LOG ONLY) ===== */
    socket.on(EVENTS.SOCKET_ERROR, (payload) => {
      console.error("🔥 SOCKET_ERROR:", payload);
      alert(JSON.stringify(payload))
      router.push(PATHS.HOME);
    });

    socket.on(EVENTS.GAME_DATA_FLOW, (payload) => {
      console.log("🎮 GAME_DATA_FLOW:", payload);
    });

    socket.on(EVENTS.ROOM_PLAYERS, (payload) => {
      console.log("👥 ROOM_PLAYERS:", payload);
    });

    socket.on(EVENTS.CONNECT_ERROR, (err) => {
      console.error("❌ CONNECT_ERROR:", err);
      if (err.message === ERRORS.Unauthorized) {
        clearGameSocket()
        router.push(PATHS.SIGN_IN)
      }
    });

    socket.on(EVENTS.ERROR, (err) => {
      console.error("❌ ERROR:", err);
      alert(JSON.stringify(payload))
      router.push(PATHS.HOME);
    });

    socket.on(EVENTS.DISCONNECT, (reason) => {
      console.warn("⚠️ SOCKET DISCONNECTED:", reason);
      router.push(PATHS.HOME);
    });

    /* ===== CLEANUP ===== */
    return () => {
      console.log("🧹 CLEANUP ROOM");
      if(socket) {
        socket.off("connect", onConnected);
        socket.off(EVENTS.SOCKET_ERROR);
        socket.off(EVENTS.GAME_DATA_FLOW);
        socket.off(EVENTS.ROOM_PLAYERS);

        if (socket.connected) {
          socket.emit(EVENTS.LEAVE_ROOM, {
            room: { code: room_code },
          });
        }

        disconnectGameSocket(); // ✅ disconnect hoàn toàn
      }
    };
  }, [room_code, router]);

  if (!connected) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Đang kết nối phòng...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4">
      <p className="text-green-400 text-center">
        ✅ Đã kết nối socket & room (xem console log)
      </p>
    </main>
  );
}
