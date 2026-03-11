"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";

export default function MicButton({ initialMuted = false, onToggle }) {
  const [muted, setMuted] = useState(initialMuted);

  const handleToggle = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    onToggle?.(nextMuted);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={muted ? "Bật micro" : "Tắt micro"}
      title={muted ? "Bật micro" : "Tắt micro"}
      className={`mic-position flex h-20 w-20 items-center justify-center rounded-full border shadow transition ${
        muted
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-white text-black hover:bg-gray-100"
      }`}
    >
      {muted ? <MicOff size={32} /> : <Mic size={32} />}
    </button>
  );
}