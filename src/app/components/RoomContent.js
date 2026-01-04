"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  connectGameSocket,
  clearGameSocket,
  disconnectGameSocket,
} from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { PHASES } from "@/constants/phases";
import { ERRORS } from "@/constants/errors";
import Loading from "@/components/Loading";
import LobbyRoom from "@/components/LobbyRoom";
import AllViewRolePhase from "@/components/AllViewRolePhase";
import { useRoom } from "@/contexts/RoomContext";

export default function RoomContent() {
  const { room_code } = useParams();
  const router = useRouter();

  const [connected, setConnected] = useState(false);
  const { gameFlow, setPlayers, setGameFlow } = useRoom();

  useEffect(() => {
    /* ===== CONNECT SOCKET ===== */
    const socket = connectGameSocket();
    if (!socket) {
      router.push(PATHS.SERVER);
      return;
    }

    /* ===== ON SOCKET CONNECT ===== */
    const onConnected = () => {
      console.log("✅ SOCKET CONNECTED:", socket.id);

      /* ===== STEP 1: CONNECT ROOM ===== */
      socket.emit(
        EVENTS.CONNECT_ROOM,
        { room: { code: room_code } },
        (res) => {
          if (!res || res.code !== 200) {
            console.error("❌ CONNECT_ROOM FAIL:", res);
            alert(JSON.stringify(res));
            router.push(PATHS.HOME);
            return;
          }

          console.log("✅ CONNECT_ROOM OK");

          /* ===== ALL DONE ===== */
          setConnected(true);
        }
      );
    };

    /* ===== SOCKET MAY ALREADY CONNECTED ===== */
    if (socket.connected) {
      onConnected();
    } else {
      socket.on(EVENTS.CONNECT, onConnected);
    }

    /* ===== LISTEN GAME EVENTS (LOG ONLY) ===== */
    socket.on(EVENTS.SOCKET_ERROR, (payload) => {
      console.error("🔥 SOCKET_ERROR:", payload);
      alert(JSON.stringify(payload));
      router.push(PATHS.HOME);
    });

    socket.on(EVENTS.GAME_DATA_FLOW, (payload) => {
      console.log("🎮 GAME_DATA_FLOW:", payload);
      if(payload?.data?.players) {
        setPlayers(payload?.data?.players || []);
      }
      setGameFlow(payload);
    });

    socket.on(EVENTS.ROOM_PLAYERS, (payload) => {
      console.log("👥 ROOM_PLAYERS:", payload);
      setPlayers(payload?.data?.players || []);
    });

    socket.on(EVENTS.CONNECT_ERROR, (err) => {
      console.error("❌ CONNECT_ERROR:", err);
      if (err.message === ERRORS.Unauthorized) {
        clearGameSocket();
        router.push(PATHS.SIGN_IN);
      }
    });

    socket.on(EVENTS.ERROR, (err) => {
      console.error("❌ ERROR:", err);
      router.push(PATHS.HOME);
    });

    socket.on(EVENTS.DISCONNECT, (reason) => {
      console.warn("⚠️ SOCKET DISCONNECTED:", reason);
      router.push(PATHS.HOME);
    });

    /* ===== CLEANUP ===== */
    return () => {
      console.log("🧹 CLEANUP ROOM");

      if (!socket) return;

      socket.off(EVENTS.CONNECT, onConnected);
      socket.off(EVENTS.SOCKET_ERROR);
      socket.off(EVENTS.GAME_DATA_FLOW);
      socket.off(EVENTS.ROOM_PLAYERS);
      socket.off(EVENTS.CONNECT_ERROR);
      socket.off(EVENTS.ERROR);
      socket.off(EVENTS.DISCONNECT);

      if (socket.connected) {
        socket.emit(EVENTS.LEAVE_ROOM, {
          room: { code: room_code },
        });
      }

      disconnectGameSocket(); // ✅ disconnect hoàn toàn
    };
  }, [room_code, router]);

  /* ===== LOBBY ===== */
  if (connected && !gameFlow) {
    return <LobbyRoom roomCode={room_code} />;
  }

  /* ===== ALL_VIEW_ROLE ===== */
  if (connected && gameFlow?.phase === PHASES.ALL_VIEW_ROLE) {
    return <AllViewRolePhase roomCode={room_code} flow={gameFlow} />;
  }

  /* ===== LOADING ===== */
  return <Loading textMsg={`Đang kết nối tới phòng ${room_code}`} />;
}
