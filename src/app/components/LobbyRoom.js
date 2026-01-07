"use client";

import { useEffect, useState, useRef } from "react";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { useRoom } from "@/contexts/RoomContext";
import CopyableText from "@/components/CopyableText";
import Loading from "@/components/Loading";
import { PATHS } from "@/constants/paths";
import { useRouter } from "next/navigation";

export default function LobbyRoom({ roomCode }) {
  const socket = getGameSocket();
  const router = useRouter();

  const { players, setPlayers } = useRoom();
  const [room, setRoom] = useState(null);

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

    // players null | undefined | []
    if (
      (!players || players.length === 0) &&
      !fetchedPlayersRef.current
    ) {
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
    socket.emit(
      EVENTS.PLAYER_READY,
      { room: { code: roomCode } },
      () => {
        setLoadingReady(false);
      }
    );
  };

  const handleLeave = () => {
    if (loadingLeave) return;

    setLoadingLeave(true);
    socket.emit(
      EVENTS.LEAVE_ROOM,
      { room: { code: roomCode } },
      () => {
        setLoadingLeave(false);
      }
    );
  };

  if (!room) return <Loading />;

  return (
    <div className="relative min-h-screen bg-black text-white">
      {/* ===== HEADER ===== */}
      <header className="fixed top-0 left-0 right-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Phòng chờ</p>
            <p className="text-lg font-bold">Room #{roomCode}</p>
            <p className="text-sm text-gray-400">
              {players?.length || 0}/{room.max_players} người • {room.status}
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-sm"
          >
            {copied ? "✅ Đã copy" : "📋 Copy code"}
          </button>
        </div>
      </header>

      {/* ===== BODY ===== */}
      <main className="pt-28 pb-28 px-4">
        <h2 className="text-lg mb-3">👥 Người chơi</h2>

        <div className="space-y-3">
          {!players || players.length === 0 ? (
            <p className="text-center text-gray-500 italic">
              Chưa có người chơi nào
            </p>
          ) : (
            players.map((p) => {
              let statusText = "";
              let statusClass = "";

              if (!p.is_connected) {
                statusText = "Mất kết nối";
                statusClass = "bg-red-500/20 text-red-400";
              } else if (p.is_ready) {
                statusText = "Sẵn sàng";
                statusClass = "bg-green-500/20 text-green-400";
              } else {
                statusText = "Chưa sẵn sàng";
                statusClass = "bg-yellow-500/20 text-yellow-400";
              }

              return (
                <div
                  key={p.player_id}
                  className="flex items-center justify-between rounded-xl bg-zinc-800 px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <CopyableText label="ID" value={p.player_id} />
                    <CopyableText label="Name" value={p.username} />
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}
                  >
                    {statusText}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4">
        <div className="flex gap-3">
          <button
            disabled={loadingReady}
            onClick={handleReady}
            className="flex-1 py-3 rounded-xl bg-green-600 disabled:opacity-40"
          >
            {loadingReady ? "⏳ Đang gửi..." : "✅ Sẵn sàng"}
          </button>

          <button
            disabled={loadingLeave}
            onClick={handleLeave}
            className="flex-1 py-3 rounded-xl bg-red-600 disabled:opacity-40"
          >
            {loadingLeave ? "⏳ Đang rời..." : "🚪 Rời phòng"}
          </button>
        </div>
      </footer>
    </div>
  );
}
