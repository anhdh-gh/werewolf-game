import { FACTION_BY_ROLE, type Faction, type RoleKey } from "@/types/game";

export interface CheckWinnerInput {
  /** Roles of whoever died in the round just resolved — only used to check
   * for Tanner (spec §4.6 step 1 must fire before the headcount checks,
   * even if that same round also wiped out every wolf). */
  deathsThisRoundRoles: RoleKey[];
  /** Roles of everyone still alive after this round's deaths are applied. */
  aliveRoles: RoleKey[];
}

/** Spec §4.6, checked in this exact order after every death announcement. */
export function checkWinner(input: CheckWinnerInput): Faction | null {
  if (input.deathsThisRoundRoles.includes("TANNER")) {
    return "TANNER";
  }

  const aliveWolves = input.aliveRoles.filter((role) => FACTION_BY_ROLE[role] === "WOLF").length;
  if (aliveWolves === 0) {
    return "VILLAGE";
  }

  const aliveRest = input.aliveRoles.length - aliveWolves;
  if (aliveWolves >= aliveRest) {
    return "WOLF";
  }

  return null;
}
