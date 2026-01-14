"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import Loading from "@/components/Loading"

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);


  /*===== self-test-start ===== */
    // ... import như cũ ...
  
  const FAKE_PLAYER = {
    player_id: 1,
    username: "Fake Player",
    role: "SEER",
    initial_role: "SEER",
    is_alive: true,
    is_connected: true,
    is_ready: true,
  };
  
    useEffect(() => {
      // 🔹 Nếu đang ở chế độ debug (roomCode = "DEBUG") thì dùng fake player, KHÔNG gọi socket
      if (roomCode === "DEBUG") {
        setPlayer(FAKE_PLAYER);
        return;
      }
    
      const socket = getGameSocket();
      if (!socket) return;
    
      const playerId = Number(localStorage.getItem(KEYS.USER_ID));
      if (!playerId) {
        router.push(PATHS.SIGN_IN);
        return;
      }
    
      socket.emit(
        EVENTS.PLAYER_INFO,
        { room: { code: roomCode }, player: { ids: [playerId] } },
        (res) => {
          if (!res?.data?.players?.length) return;
          setPlayer(res.data.players[0]);
        }
      );
    }, [roomCode, router]);
  
    /*===== self-test-end ===== */

  useEffect(() => {
    const selected = localStorage.getItem(KEYS.SERVER_SELECTED);
    if (!selected) {
      router.replace(PATHS.SERVER); // no server → redirect
    } else {
      //
      const accessToken = localStorage.getItem(KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(KEYS.REFRESH_TOKEN);
      if (!accessToken || !refreshToken) {
        // no token → redirect
        router.replace(PATHS.SIGN_IN);
      } else {
        setAllowed(true);
      }
    }
  }, []);

  if (!allowed) <Loading />
  return children;
}
