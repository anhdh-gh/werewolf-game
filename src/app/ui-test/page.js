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

export default function UITestPage(){
  
  const TEST_PHASE = PHASES.NIGHT_WITCH_SAVE; 

  const TEST_ROLE = ROLES.WITCH;
 
  const [phase] = useState(TEST_PHASE);
  const [role] = useState(TEST_ROLE);

  // Fake user session để tránh redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEYS.USER_ID)) {
      localStorage.setItem(KEYS.USER_ID, "1");
    }
    if (!localStorage.getItem(KEYS.USERNAME)) {
      localStorage.setItem(KEYS.USERNAME, "Test Player");
    }
  }, []);

  // Mock Data Player
  const mockPlayers = [
    {
      player_id: 1,
      username: "Bạn (Tester)",
      role: role, // Role theo config
      initial_role: role,
      is_alive: true,
      is_connected: true,
      is_ready: true,
      witch_heal: 1,
      witch_kill: 1,
    },
    {
      player_id: 2,
      username: "Nạn nhân A",
      role: ROLES.VILLAGER,
      initial_role: ROLES.VILLAGER,
      is_alive: true,
      is_connected: true,
      is_ready: true,
    },
    {
      player_id: 3,
      username: "FAKE_PLAYER",
      role: ROLES.WEREWOLF,
      initial_role: ROLES.WEREWOLF,
      is_alive: true,
      is_connected: true,
      is_ready: true,
    },
    {
        player_id: 4,
        username: "Người chơi B",
        role: ROLES.SEER,
        initial_role: ROLES.SEER,
        is_alive: true,
        is_connected: true,
        is_ready: true,
      },
  ];

  const phaseMessages = {[PHASES.ALL_VIEW_ROLE]: "Hãy xem vai trò của bạn",
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

  // Render logic
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
        return <div className="flex items-center justify-center h-screen bg-black text-red-500 font-bold text-2xl">Phase chưa được định nghĩa trong Test!</div>;
    }
  };

  // 👇 CHỈ RETURN ĐÚNG UI CỦA PHASE, KHÔNG BỌC GÌ THÊM
  return (
    <>
        {renderPhase()}
    </>
  );
}