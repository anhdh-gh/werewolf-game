import type { PhaseName, RoleKey } from "@/types/game";

/** Which role(s) act during each phase that actually requires input. Phases
 * absent here (NIGHT_FALLS, DAWN, DISCUSSION, VOTE_RESULT, REVEAL_ROLE,
 * ENDED) are announcement/wait-only — nobody is "required", they just run
 * out their duration. VOTE is handled separately since everyone alive
 * votes, not one role. */
const ACTING_ROLE_BY_PHASE: Partial<Record<PhaseName, RoleKey>> = {
  SEER: "SEER",
  BODYGUARD: "BODYGUARD",
  MUTER: "MUTER",
  WITCH_SAVE: "WITCH",
  WITCH_KILL: "WITCH",
  CURSED: "CURSED",
  PAIR_LOVERS: "CUPID",
};

/**
 * Spec §4.3: "phase kết thúc sớm khi tất cả người chơi được yêu cầu hành
 * động trong phase đó đã xong." The advance route checks this before
 * transitioning early — this function is the single source of truth for
 * who that phase actually requires, given who's alive and what role they
 * hold. WOLVES is every alive Werewolf (not the Traitor — spec §4.1, the
 * Traitor never wakes with the pack).
 */
export function requiredActorsForPhase(
  phase: PhaseName,
  aliveRolesByUid: Record<string, RoleKey>,
): string[] {
  if (phase === "WOLVES") {
    return Object.entries(aliveRolesByUid)
      .filter(([, role]) => role === "WEREWOLF")
      .map(([uid]) => uid);
  }

  if (phase === "VOTE") {
    return Object.keys(aliveRolesByUid);
  }

  const actingRole = ACTING_ROLE_BY_PHASE[phase];
  if (!actingRole) return [];

  return Object.entries(aliveRolesByUid)
    .filter(([, role]) => role === actingRole)
    .map(([uid]) => uid);
}
