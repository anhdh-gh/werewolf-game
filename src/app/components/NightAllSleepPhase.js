"use client";

import { useEffect, useRef } from "react";
import Loading from "@/components/Loading";

export default function NightAllSleepPhase({ roomCode, flow }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!flow?.message) return;

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
        console.log("Đang đọc:", flow.message);
      } catch (err) {
        if (err.name === "AbortError") {
          console.log("Audio bị ngắt (bình thường):", err.message);
        } else if (err.name === "NotAllowedError") {
          console.error("Vẫn bị chặn Autoplay, cần click:", err);
        } else {
          console.error("Lỗi Audio khác:", err);
        }
      }
    };

    playAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [flow?.message]);

  if (!flow?.message){
    return <Loading textMsg="Đang chuẩn bị..." />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-black text-white px-4">
      {/* MESSAGE */}
      <p className="text-lg text-gray-300 text-center max-w-md animate-pulse">
        {flow.message}
      </p>

      {/* ICON NGỦ */}
      <div className="flex flex-col items-center justify-center mt-6">
        <span className="text-6xl animate-bounce">😴</span>
        <p className="mt-2 text-sm text-gray-500">Mọi người đang ngủ...</p>
      </div>
    </div>
  );
}
