"use client";

import { createContext, useContext, useMemo, useState } from "react";

/**
 * RoomContext dùng để chia sẻ state room cho toàn bộ màn Room
 * Tránh props drilling khi game flow phức tạp dần
 */
const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [players, setPlayers] = useState([]);
  const [gameFlow, setGameFlow] = useState(null);

  /**
   * gom tất cả state + setter lại
   * useMemo để tránh re-render không cần thiết
   */
  const value = useMemo(
    () => ({
      players,
      setPlayers,
      gameFlow,
      setGameFlow,
    }),
    [players, gameFlow]
  );

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
}

/**
 * Hook dùng trong các component con
 * Ví dụ: const { players } = useRoom();
 */
export function useRoom() {
  const ctx = useContext(RoomContext);
  if (!ctx) {
    throw new Error("useRoom must be used inside <RoomProvider>");
  }
  return ctx;
}
