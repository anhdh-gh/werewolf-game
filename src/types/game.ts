export type RoleKey =
  | "WEREWOLF"
  | "TRAITOR"
  | "SEER"
  | "WITCH"
  | "BODYGUARD"
  | "HUNTER"
  | "CUPID"
  | "MUTER"
  | "CURSED"
  | "LYCAN"
  | "TANNER"
  | "VILLAGER";

export type Faction = "WOLF" | "VILLAGE" | "TANNER";

/** Spec §4.1's faction column. Every role belongs to exactly one of these —
 * including the two "soi nhầm" cases (TRAITOR is WOLF despite reading as
 * VILLAGE to the Seer; LYCAN is VILLAGE despite reading as WOLF). */
export const FACTION_BY_ROLE: Record<RoleKey, Faction> = {
  WEREWOLF: "WOLF",
  TRAITOR: "WOLF",
  SEER: "VILLAGE",
  WITCH: "VILLAGE",
  BODYGUARD: "VILLAGE",
  HUNTER: "VILLAGE",
  CUPID: "VILLAGE",
  MUTER: "VILLAGE",
  CURSED: "VILLAGE",
  LYCAN: "VILLAGE",
  TANNER: "TANNER",
  VILLAGER: "VILLAGE",
};

/** Spec §4.1: what the Seer's check reports for a role. Only WEREWOLF and
 * LYCAN read as wolf — TRAITOR is wolf-faction but reads as villager, LYCAN
 * is village-faction but reads as wolf. Everything else reads as villager. */
const SEER_SEES_AS_WOLF: ReadonlySet<RoleKey> = new Set(["WEREWOLF", "LYCAN"]);

export function seerCheck(role: RoleKey): "WOLF" | "VILLAGER" {
  return SEER_SEES_AS_WOLF.has(role) ? "WOLF" : "VILLAGER";
}

export const PHASE_SEQUENCE = [
  "REVEAL_ROLE",
  "PAIR_LOVERS",
  "NIGHT_FALLS",
  "SEER",
  "BODYGUARD",
  "MUTER",
  "WOLVES",
  "WITCH_SAVE",
  "WITCH_KILL",
  "CURSED",
  "DAWN",
  "DISCUSSION",
  "VOTE",
  "VOTE_RESULT",
] as const;

export type PhaseName = (typeof PHASE_SEQUENCE)[number] | "ENDED";

/** Which optional role (src/types/room.ts) a phase requires — phases for
 * mandatory roles (Seer, Witch, wolves) or non-role phases have no entry.
 * TRAITOR and LYCAN have no entry here because they never get a phase at
 * all (spec §4.3) — they only affect role dealing and Seer results. */
export const PHASE_OPTIONAL_ROLE: Partial<Record<PhaseName, RoleKey>> = {
  PAIR_LOVERS: "CUPID",
  BODYGUARD: "BODYGUARD",
  MUTER: "MUTER",
  CURSED: "CURSED",
};

export interface GamePlayer {
  name: string;
  alive: boolean;
  muted: boolean;
}

export interface GamePhase {
  name: PhaseName;
  endsAt: number;
  version: number;
  requiredActors: string[];
}

export interface GameResult {
  winner: Faction;
  revealedRoles: Record<string, RoleKey>;
}

export interface Game {
  roomCode: string;
  startedAt: number;
  dayNumber: number;
  phase: GamePhase;
  players: Record<string, GamePlayer>;
  result?: GameResult;
}

export interface SeerHint {
  targetUid: string;
  result: "WOLF" | "VILLAGER";
  dayNumber: number;
}

/** /private/{gameId}/{uid} — never readable by anyone but that uid. */
export interface PrivatePlayerState {
  role: RoleKey;
  initialRole: RoleKey;
  potions: { heal: boolean; poison: boolean };
  /** Set on both members of a Cupid pair — spec §4.4 step 7. */
  loverUid?: string;
  /** The Seer's own check history — RTDB push() keys, so this is a map, not
   * an array. Only ever present for a uid dealt the Seer role. */
  hints?: Record<string, SeerHint>;
}

export interface NightActions {
  protect?: Record<string, string>;
  wolves?: Record<string, string>;
  witchSave?: Record<string, string>;
  witchKill?: Record<string, string>;
  muter?: Record<string, string>;
  cursedTransformed?: Record<string, true>;
}
