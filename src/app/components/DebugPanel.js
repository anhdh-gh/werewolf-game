"use client";

import { useState } from "react";
import { PHASES } from "@/constants/phases";
import { ROLES } from "@/constants/roles";
import { ACTIONS } from "@/constants/actions";
import { useRoom } from "@/contexts/RoomContext";
import { KEYS } from "@/constants/keys";

export default function DebugPanel() {
  const { setGameFlow, setPlayers } = useRoom();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState(PHASES.ALL_VIEW_ROLE);
  const [selectedRole, setSelectedRole] = useState(ROLES.SEER);

  const phases = Object.values(PHASES);
  const roles = Object.values(ROLES);

  // Lấy user ID từ localStorage (nếu có)
  const getUserId = () => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem(KEYS.USER_ID);
      return userId ? Number(userId) : 1;
    }
    return 1;
  };

  const getUsername = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(KEYS.USERNAME) || "Test Player";
    }
    return "Test Player";
  };

  const mockGameFlow = (phase, role) => {
    const userId = getUserId();
    const username = getUsername();

    // Mock players list (cần cho một số phase)
    const mockPlayers = [
      {
        player_id: userId,
        username: username,
        role: role,
        initial_role: role,
        is_alive: true,
        is_connected: true,
        is_ready: true,
        witch_heal: 1, // Witch cần field này
        witch_kill: 1, // Witch cần field này
      },
      {
        player_id: 2,
        username: "Player 2",
        role: ROLES.VILLAGER,
        initial_role: ROLES.VILLAGER,
        is_alive: true,
        is_connected: true,
        is_ready: true,
      },
      {
        player_id: 3,
        username: "Player 3",
        role: ROLES.WEREWOLF,
        initial_role: ROLES.WEREWOLF,
        is_alive: true,
        is_connected: true,
        is_ready: true,
      },
    ];

    // Messages cho từng phase
    const phaseMessages = {
      [PHASES.ALL_VIEW_ROLE]: "Hãy xem vai trò của bạn",
      [PHASES.NIGHT_ALL_SLEEP]: "Tất cả mọi người đang ngủ...",
      [PHASES.NIGHT_SEER]: "Tiên tri thức dậy",
      [PHASES.NIGHT_WOLF]: "Sói thức dậy",
      [PHASES.NIGHT_GUARD]: "Bảo vệ thức dậy",
      [PHASES.NIGHT_WITCH_SAVE]: "Phù thủy thức dậy - Cứu người",
      [PHASES.NIGHT_WITCH_KILL]: "Phù thủy thức dậy - Giết người",
      [PHASES.NIGHT_SILENCED]: "Người bị câm thức dậy",
      [PHASES.NIGHT_CURSED]: "Người bị nguyền rủa thức dậy",
      [PHASES.DAY_DISCUSSION]: "Ngày thảo luận",
      [PHASES.END]: "Trò chơi kết thúc",
    };

    const mockFlow = {
      phase: phase,
      message: phaseMessages[phase] || `Testing ${phase}`,
      event: {
        action: ACTIONS.WAKEUP, // Để trigger interactive UI
      },
      data: {
        players: mockPlayers, // Một số phase cần players list
      },
    };

    setGameFlow(mockFlow);
    setPlayers(mockPlayers);
  };

  // Nút toggle (khi đóng)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold transition"
      >
        🐛 Debug
      </button>
    );
  }

  // Panel mở
  return (
    <div className="fixed bottom-4 right-4 z-[9999] bg-black/95 border-2 border-purple-600 rounded-lg p-4 w-80 max-h-[80vh] overflow-y-auto shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
        <h3 className="text-white font-bold text-lg">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-red-400 text-xl transition"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Phase Selector */}
        <div>
          <label className="text-white text-sm font-semibold block mb-2">
            Phase:
          </label>
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            {phases.map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
        </div>

        {/* Role Selector */}
        <div>
          <label className="text-white text-sm font-semibold block mb-2">
            Your Role:
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full p-2 bg-gray-800 text-white rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {/* Apply Button */}
        <button
          onClick={() => mockGameFlow(selectedPhase, selectedRole)}
          className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded font-semibold transition"
        >
          ✅ Apply & Test
        </button>

        {/* Reset Button */}
        <button
          onClick={() => {
            setGameFlow(null);
            setPlayers([]);
          }}
          className="w-full bg-red-600 hover:bg-red-500 text-white py-2 rounded font-semibold transition"
        >
          🔄 Reset (Back to Lobby)
        </button>

        {/* Info */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            💡 Tip: Chọn phase và role, sau đó click "Apply & Test" để xem UI
            tương ứng. Một số phase cần role cụ thể để hiển thị interactive UI.
          </p>
        </div>
      </div>
    </div>
  );
}