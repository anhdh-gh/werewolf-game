"use client";

import { createContext, useContext, useMemo, useState } from "react";

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [gameFlow, setGameFlow] = useState(null);

  // ⭐ voice info
  const [voiceInfo, setVoiceInfo] = useState(null);

  const value = useMemo(
    () => ({
      players,
      setPlayers,
      gameFlow,
      setGameFlow,
      voiceInfo,
      setVoiceInfo,
    }),
    [players, gameFlow, voiceInfo]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error("useRoom must be used inside <RoomProvider>");
  }
  return ctx;
}