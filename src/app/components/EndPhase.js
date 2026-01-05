"use client";

import { useEffect, useRef } from "react";
import Loading from "@/components/Loading";
import { PATHS } from "@/constants/paths";
import { useRoom } from "@/contexts/RoomContext";

export default function EndPhase({ roomCode, flow }) {
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const { setPlayers, setGameFlow } = useRoom();

  /* ===== TTS + AUTO REDIRECT ===== */
  useEffect(() => {
    if (!flow?.message) return;

    // ===== PLAY TTS =====
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const playAudio = async () => {
      try {
        const url = `/api/v1/tts?text=${encodeURIComponent(flow.message)}`;
        audio.src = url;
        audio.load();
        await audio.play();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.warn("TTS error:", err?.message);
        }
      }
    };

    playAudio();

    // ===== AUTO BACK TO LOBBY (10s) =====
    timerRef.current = setTimeout(() => {
      setPlayers([]);
      setGameFlow(null)
    }, 10_000);

    // ===== CLEANUP =====
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [flow?.message, roomCode, router]);

  if (!flow?.message) {
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  /* ===== UI ===== */
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
      <p className="text-xl font-semibold text-center max-w-md animate-pulse">
        {flow.message}
      </p>

      <p className="text-sm text-gray-500">
        Tự động quay về phòng chờ sau 10 giây...
      </p>
    </div>
  );
}
