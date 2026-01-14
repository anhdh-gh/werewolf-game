"use client";

import { useEffect, useState } from "react";
import { PHASES } from "@/constants/phases";
import { ROLES } from "@/constants/roles";
import { ACTIONS } from "@/constants/actions";
import { KEYS } from "@/constants/keys";

// Import các phase component thật
import AllViewRolePhase from "@/components/AllViewRolePhase";
import NightSeerPhase from "@/components/NightSeerPhase";
import NightWolfPhase from "@/components/NightWolfPhase";
import NightWitchSave from "@/components/NightWitchSave";
import NightWitchKill from "@/components/NightWitchKill";
import NightGuardPhase from "@/components/NightGuardPhase";
import NightSilencedPhase from "@/components/NightSilencedPhase";
import NightCursedPhase from "@/components/NightCursedPhase";
import NightAllSleepPhase from "@/components/NightAllSleepPhase";
import DayDiscussionPhase from "@/components/DayDiscussionPhase";
import EndPhase from "@/components/EndPhase";

export default function UITestPage() {
  const [phase, setPhase] = useState(PHASES.ALL_VIEW_ROLE);
  const [role, setRole] = useState(ROLES.SEER);

  // Đảm bảo có user trong localStorage để các phase không redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEYS.USER_ID)) {
      localStorage.setItem(KEYS.USER_ID, "1");
    }
    if (!localStorage.getItem(KEYS.USERNAME)) {
      localStorage.setItem(KEYS.USERNAME, "Test Player");
    }
  }, []);

  const phases = Object.values(PHASES);
  const roles = Object.values(ROLES);

  // Mock flow chung
  const mockPlayers = [
    {
      player_id: 1,
      username: "Test Player",
      role: role,
      initial_role: role,
      is_alive: true,
      is_connected: true,
      is_ready: true,
      witch_heal: 1,
      witch_kill: 1,
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

  const phaseMessages = {
    [PHASES.ALL_VIEW_ROLE]: "Hãy xem vai trò của bạn",
    [PHASES.NIGHT_ALL_SLEEP]: "Mọi người cùng ngủ...",
    [PHASES.NIGHT_SEER]: "Tiên tri thức dậy",
    [PHASES.NIGHT_WOLF]: "Sói thức dậy",
    [PHASES.NIGHT_GUARD]: "Bảo vệ thức dậy",
    [PHASES.NIGHT_WITCH_SAVE]: "Phù thủy cứu người",
    [PHASES.NIGHT_WITCH_KILL]: "Phù thủy giết người",
    [PHASES.NIGHT_SILENCED]: "Người bị câm thức dậy",
    [PHASES.NIGHT_CURSED]: "Người bị nguyền rủa thức dậy",
    [PHASES.DAY_DISCUSSION]: "Ngày thảo luận",
    [PHASES.END]: "Trò chơi kết thúc",
  };

  const mockFlow = {
    phase,
    message: phaseMessages[phase] || `Testing ${phase}`,
    event: { action: ACTIONS.WAKEUP },
    data: { players: mockPlayers },
  };

  // 🔁 SWITCH CASE render UI
  const renderPhase = () => {
    const roomCode = "DEBUG";

    switch (phase) {
      case PHASES.ALL_VIEW_ROLE:
        return <AllViewRolePhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_ALL_SLEEP:
        return <NightAllSleepPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_SEER:
        return <NightSeerPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_WOLF:
        return <NightWolfPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_WITCH_SAVE:
        return <NightWitchSave roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_WITCH_KILL:
        return <NightWitchKill roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_GUARD:
        return <NightGuardPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_SILENCED:
        return <NightSilencedPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.NIGHT_CURSED:
        return <NightCursedPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.DAY_DISCUSSION:
        return <DayDiscussionPhase roomCode={roomCode} flow={mockFlow} />;

      case PHASES.END:
        return <EndPhase roomCode={roomCode} flow={mockFlow} />;

      default:
        return <div className="p-4 text-white">Chọn phase để xem UI</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Panel chọn phase/role */}
      <div className="w-72 border-r border-gray-800 p-4 space-y-4 bg-zinc-900">
        <h1 className="text-lg font-bold mb-2">UI Phase Preview</h1>

        <div>
          <label className="block text-sm mb-1">Phase:</label>
          <select
            value={phase}
            onChange={(e) => setPhase(e.target.value)}
            className="w-full p-2 bg-zinc-800 rounded border border-gray-700"
          >
            {phases.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Role (của bạn):</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 bg-zinc-800 rounded border border-gray-700"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs text-gray-400">
          Chỉ để xem UI, không cần socket / flow thật.
        </p>
      </div>

      {/* Khu vực hiển thị UI phase */}
      <div className="flex-1 overflow-auto">{renderPhase()}</div>
    </div>
  );
}