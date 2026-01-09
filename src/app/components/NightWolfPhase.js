"use client";

import { useEffect, useRef, useState } from "react";
import Loading from "@/components/Loading";
import CopyableText from "@/components/CopyableText";
import { getGameSocket } from "@/socket/gameSocket";
import { EVENTS } from "@/constants/events";
import { PATHS } from "@/constants/paths";
import { KEYS } from "@/constants/keys";
import { ACTIONS } from "@/constants/actions";
import { ROLES } from "@/constants/roles";
import { useRouter } from "next/navigation";

export default function NightWolfPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== CHAT ===== */
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const chatEndRef = useRef(null);

  /* ===== TTS ===== */
  const audioRef = useRef(null);

  /* ===== FETCH PLAYER ===== */
  useEffect(() => {
    if (!socket) return;

    const playerId = Number(localStorage.getItem(KEYS.USER_ID));
    if (!playerId) {
      router.push(PATHS.SIGN_IN);
      return;
    }

    // self
    socket.emit(
      EVENTS.PLAYER_INFO,
      { room: { code: roomCode }, player: { ids: [playerId] } },
      (res) => {
        if (res?.data?.players?.length) {
          setPlayer(res.data.players[0]);
        }
      }
    );

    // all players
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players) return;
      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready
        )
      );
    });
  }, [roomCode, socket, router]);

  /* ===== CHAT LISTENER ===== */
  useEffect(() => {
    if (!socket) return;

    const handler = (chat) => {
      console.log("🐺 [ROOM_CHAT RAW]:", chat);

      if (!chat?.message) {
        console.warn("⚠️ Invalid chat payload:", chat);
        return;
      }

      setChatMessages((prev) => {
        const next = [...prev, chat];
        return next.length > 10 ? next.slice(-10) : next;
      });

      if (!isChatOpen && chat.id !== player?.player_id) {
        setHasUnread(true);
      }
    };

    socket.on(EVENTS.ROOM_CHAT, handler);
    return () => socket.off(EVENTS.ROOM_CHAT, handler);
  }, [socket, isChatOpen, player]);

  /* ===== AUTO SCROLL ===== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  /* ===== TTS ===== */
  useEffect(() => {
    if (!flow?.message) return;

    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;

    const play = async () => {
      try {
        audio.src = `/api/v1/tts?text=${encodeURIComponent(flow.message)}`;
        audio.load();
        await audio.play();
      } catch {}
    };

    play();
    return () => audio.pause();
  }, [flow?.message]);

  /* ===== PERMISSION ===== */
  const canWolfAct =
    player?.role === ROLES.WEREWOLF &&
    player?.is_alive &&
    player?.is_connected &&
    player?.is_ready &&
    flow?.event?.action === ACTIONS.WAKEUP;

  const hasSelected = !!selectedPlayer;

  /* ===== ACTIONS ===== */
  const handleVote = (p) => {
    if (isLoading) return;
    setSelectedPlayer(p);

    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: { id: p.player_id, username: p.username },
    });
  };

  const handleDone = () => {
    if (isLoading) return;
    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;

    socket.emit(EVENTS.PLAYER_CHAT, {
      room: { code: roomCode },
      chat: { message: chatInput.trim() },
    });
    setChatInput("");
  };

  /* ===== INITIAL ===== */
  if (!flow?.message || !player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  if (!canWolfAct) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
        <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
          {flow.message}
        </p>
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id})</p>
        </div>
      </div>
    );
  }

  /* ===== VIEW ===== */
  return (
    <div className="relative h-screen bg-black text-white flex flex-col">
      {/* HEADER */}
      <header className="p-4 border-b border-zinc-800">
        <h2 className="font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
        <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id})</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        <h3 className="text-sm text-gray-400">🐺 Chọn người để cắn</h3>

        {playersList.map((p) => {
          const isSelected = selectedPlayer?.player_id === p.player_id;

          return (
            <div
              key={p.player_id}
              onClick={() => handleVote(p)}
              className={`flex justify-between items-center px-4 py-3 rounded-xl cursor-pointer
                ${
                  isSelected
                    ? "bg-red-700 border border-red-500"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }
              `}
            >
              <div className="flex flex-col gap-1">
                <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                <CopyableText label="Name" value={p.username} />
              </div>
              <span className="text-red-400 font-bold">🐺</span>
            </div>
          );
        })}
      </main>

      {/* FOOTER */}
      <footer className="p-4 border-t border-zinc-800 flex gap-3">
        {!hasSelected && (
          <button
            disabled={isLoading}
            onClick={handleDone}
            className="flex-1 py-3 rounded-xl font-bold bg-zinc-700"
          >
            Bỏ qua
          </button>
        )}
        <button
          disabled={isLoading}
          onClick={handleDone}
          className="flex-1 py-3 rounded-xl font-bold bg-red-600"
        >
          Đã xong
        </button>
      </footer>

      {/* CHAT BUTTON */}
      <button
        onClick={() => {
          setIsChatOpen(true);
          setHasUnread(false);
        }}
        className="fixed bottom-24 right-4 z-40 bg-red-600 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      >
        💬
        {hasUnread && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </button>

      {/* CHAT POPUP */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <header className="p-4 border-b border-zinc-800 flex justify-between">
            <span>🐺 Sói trò chuyện</span>
            <button onClick={() => setIsChatOpen(false)}>❌</button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((c, i) => {
              const isSelf = c.id === player.player_id;

              return (
                <div
                  key={i}
                  className={`flex ${isSelf ? "justify-end" : "justify-start"}`}
                >
                  <div className="bg-zinc-700 rounded-xl px-3 py-2 max-w-[80%]">
                    {/* LUÔN HIỆN ID + USERNAME */}
                    <p className="text-xs text-gray-400 mb-1">
                      {c.username} (ID: {c.id})
                    </p>
                    <p>{c.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 border-t border-zinc-800 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Nhập tin nhắn..."
              className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 outline-none"
            />
            <button
              onClick={handleSendChat}
              className="bg-red-600 px-4 rounded-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black flex items-center justify-center">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
