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
  const [viewVotedDead, setViewVotedDead] = useState(false);

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

  /* ===== HANDLE FLOW ACTION ===== */
  useEffect(() => {
    if (!flow?.event?.action) return;

    // 👉 Kết quả vote (chỉ xem)
    if (flow.event.action === ACTIONS.VIEW) {
      setViewVotedDead(true);
      setIsVoting(false);
      setIsLoading(false);
      return;
    }

    // 👉 Cho phép vote
    if (flow.event.action === ACTIONS.VOTE) {
      setViewVotedDead(false);
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
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("TTS error:", err?.message);
        }
      }
    };

    play();
    return () => audio.pause();
  }, [flow?.message]);

  if (!player) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /* ===== INTERACTION CONDITION ===== */
  const canInteract =
    player.is_alive &&
    player.is_connected &&
    player.is_ready &&
    flow?.event?.action === ACTIONS.VOTE &&
    !viewVotedDead;

  /* ===== LOAD PLAYERS FOR VOTE ===== */
  const loadPlayersForVote = () => {
    if (!socket) return;

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
    if (!socket || isLoading) return;

    setSelectedPlayer(p);

    socket.emit(EVENTS.PLAYER_VOTE, {
      room: { code: roomCode },
      current_phase: flow.phase,
      target: {
        id: p.player_id,
        username: p.username,
      },
    });
  };

  /* ===== DONE ===== */
  const handleDone = () => {
    if (!socket || isLoading) return;

    setIsLoading(true);

    socket.emit(EVENTS.PLAYER_DONE, {
      room: { code: roomCode },
      current_phase: flow.phase,
    });
  };

  const votedDeadPlayers = flow?.data?.players || [];

  /* ===== UI ===== */
  return (
    <div className="relative h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10">
        <h2 className="text-lg font-bold">{flow.message}</h2>
        <p className="text-sm text-gray-400">Room #{roomCode}</p>
      </header>

      {/* BODY */}
      <main className="flex-1 overflow-y-auto p-4">
        {/* ===== VIEW RESULT ===== */}
        {flow.event?.action === ACTIONS.VIEW && votedDeadPlayers.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-red-400">
              ☠️ Người bị vote chết
            </h3>

            <div className="space-y-2">
              {votedDeadPlayers.map((p) => (
                <div
                  key={p.player_id}
                  className="bg-zinc-800 rounded-xl p-3"
                >
                  <CopyableText label="ID" value={p.player_id} />
                  <CopyableText label="Name" value={p.username} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== VOTING ===== */}
        {flow.event?.action === ACTIONS.VOTE && isVoting && (
          <div>
            <h3 className="text-md mb-3">🗳️ Chọn người để treo cổ</h3>

            <div className="space-y-3 pb-4">
              {playersList.map((p) => {
                const isSelected =
                  selectedPlayer?.player_id === p.player_id;

                return (
                  <div
                    key={p.player_id}
                    onClick={() => handleVote(p)}
                    className={`w-full flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition
                      ${
                        isSelected
                          ? "bg-red-700 border border-red-500"
                          : "bg-zinc-800 hover:bg-zinc-700"
                      }
                      ${isLoading ? "pointer-events-none opacity-60" : ""}
                    `}
                  >
                    <div className="flex flex-col gap-1">
                      <CopyableText label="ID" value={p.player_id} />
                      <CopyableText label="Name" value={p.username} />
                    </div>

                    <span className="text-gray-400 text-sm">🗳️ Vote</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      {canInteract && (
        <footer className="shrink-0 bg-zinc-900 border-t border-zinc-800 p-4 z-10 flex gap-3">
          {!isVoting ? (
            <button
              onClick={loadPlayersForVote}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition"
            >
              Bắt đầu vote
            </button>
          ) : (
            <>
              <button
                disabled={isLoading}
                onClick={handleDone}
                className="flex-1 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 font-bold transition"
              >
                Bỏ qua
              </button>

              <button
                disabled={isLoading}
                onClick={handleDone}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold transition"
              >
                Đã xong
              </button>
            </>
          )}
        </footer>
      )}

      {/* GLOBAL LOADING */}
      {isLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
          <Loading textMsg="Đang xử lý kết quả vote..." />
        </div>
      )}
    </div>
  );
}
