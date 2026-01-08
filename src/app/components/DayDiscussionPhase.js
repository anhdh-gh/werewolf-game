"use client";

import { useEffect, useState, useRef } from "react";
import { EVENTS } from "@/constants/events";
import { getGameSocket } from "@/socket/gameSocket";
import { KEYS } from "@/constants/keys";
import { PATHS } from "@/constants/paths";
import Loading from "@/components/Loading";
import CopyableText from "@/components/CopyableText";
import { useRouter } from "next/navigation";
import { ACTIONS } from "@/constants/actions";

export default function DayDiscussionPhase({ roomCode, flow }) {
  const router = useRouter();
  const socket = getGameSocket();

  const [player, setPlayer] = useState(null);
  const [playersList, setPlayersList] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /* ===== CHAT ===== */
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [hasUnread, setHasUnread] = useState(false);
  const chatEndRef = useRef(null);

  const audioRef = useRef(null);

  /* ===== FETCH SELF PLAYER ===== */
  useEffect(() => {
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
  }, [roomCode, socket, router]);

  /* ===== FLOW ACTION ===== */
  useEffect(() => {
    if (!flow?.event?.action) return;

    if (
      flow.event.action === ACTIONS.VIEW ||
      flow.event.action === ACTIONS.VOTE
    ) {
      setIsVoting(false);
      setIsLoading(false);
      setSelectedPlayer(null);
    }
  }, [flow]);

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

  /* ===== CHAT LISTENER ===== */
  useEffect(() => {
    if (!socket) return;

    const handler = (chat) => {
      console.log("🌞 [DAY CHAT RAW]:", chat);

      if (!chat?.message) return;

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

  /* ===== AUTO SCROLL CHAT ===== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatOpen]);

  if (!player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /* ===== INTERACTION CONDITION ===== */
  const canInteract =
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.VOTE;

  /* ===== LOAD PLAYERS FOR VOTE ===== */
  const loadPlayersForVote = () => {
    socket.emit(EVENTS.PLAYER_INFO, { room: { code: roomCode } }, (res) => {
      if (!res?.data?.players?.length) return;

      setPlayersList(
        res.data.players.filter(
          (p) => p.is_alive && p.is_connected && p.is_ready
        )
      );
      setIsVoting(true);
    });
  };

  /* ===== VOTE ===== */
  const handleVote = (p) => {
    if (isLoading) return;

    setSelectedPlayer(p);

    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: { id: p.player_id, username: p.username },
    });
  };

  /* ===== DONE ===== */
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

  const deadPlayers = Array.isArray(flow?.data?.players)
    ? flow.data.players
    : [];

  /* ===== UI ===== */
  return (
    <div className="relative h-screen flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
        <p className="text-sm text-gray-500">{player?.username} (ID: {player?.player_id}) ({player?.role})</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4">
        {deadPlayers.length > 0 && (
          <div
            key={p.player_id}
            className={`w-full flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition`}
          >
            <div className="flex flex-col gap-1">
              <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
              <CopyableText label="Name" value={p.username} />
            </div>

            <span className="text-purple-400 font-bold">
              {p?.is_muted ? '🤐 Câm' : '🐺 Chết'}
            </span>
          </div>
        )}

        {isVoting && (
          <>
            <h3 className="mb-3">🗳️ Chọn người để treo cổ</h3>
            <div className="space-y-3">
              {playersList.map((p) => {
                const isSelected =
                  selectedPlayer?.player_id === p.player_id;

                return (
                  <div
                    key={p.player_id}
                    onClick={() => handleVote(p)}
                    className={`rounded-xl px-4 py-3 cursor-pointer
                      ${
                        isSelected
                          ? "bg-red-700"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                  >
                    <CopyableText label="ID" value={`${p.player_id}${p.player_id === player?.player_id ? ' (Me)' : ''}`} />
                    <CopyableText label="Name" value={p.username} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* FOOTER */}
      {canInteract && (
        <footer className="bg-zinc-900 border-t border-zinc-800 p-4 flex gap-3">
          {!isVoting ? (
            <button
              onClick={loadPlayersForVote}
              className="w-full py-3 rounded-xl bg-blue-600 font-bold"
            >
              Bắt đầu vote
            </button>
          ) : (
            <>
              {!selectedPlayer && <button
                onClick={handleDone}
                className="flex-1 py-3 rounded-xl bg-zinc-700 font-bold"
              >
                Bỏ qua
              </button>}
              <button
                onClick={handleDone}
                className="flex-1 py-3 rounded-xl bg-red-600 font-bold"
              >
                Đã xong
              </button>
            </>
          )}
        </footer>
      )}

      {/* CHAT BUTTON */}
      {canInteract && !player?.is_muted && <button
        onClick={() => {
          setIsChatOpen(true);
          setHasUnread(false);
        }}
        className="fixed bottom-24 right-4 bg-blue-600 w-14 h-14 rounded-full shadow-lg z-40"
      >
        💬
        {hasUnread && (
          <span className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full animate-ping" />
        )}
      </button>}

      {/* CHAT POPUP */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <header className="p-4 border-b border-zinc-800 flex justify-between">
            <span>🌞 Cả làng thảo luận</span>
            <button onClick={() => setIsChatOpen(false)}>❌</button>
          </header>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {chatMessages.map((c, i) => (
              <div
                key={i}
                className={`flex ${
                  c.id === player.player_id
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div className="bg-zinc-700 rounded-xl px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-gray-400 mb-1">
                    {c.username} (ID: {c.id})
                  </p>
                  <p>{c.message}</p>
                </div>
              </div>
            ))}
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
              className="bg-blue-600 px-4 rounded-lg"
            >
              Gửi
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center">
          <Loading textMsg="Đang xử lý..." />
        </div>
      )}
    </div>
  );
}
