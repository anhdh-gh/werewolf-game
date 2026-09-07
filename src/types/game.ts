export type RoleKey =
  | "WEREWOLF"
  | "SEER"
  | "WITCH"
  | "BODYGUARD"
  | "MUTER"
  | "CURSED"
  | "TANNER"
  | "VILLAGER";

export type Faction = "WOLF" | "VILLAGE" | "TANNER";

export const PHASE_SEQUENCE = [
  "REVEAL_ROLE",
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
 * mandatory roles (Seer, Witch, wolves) or non-role phases have no entry. */
export const PHASE_OPTIONAL_ROLE: Partial<Record<PhaseName, RoleKey>> = {
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

/** /private/{gameId}/{uid} — never readable by anyone but that uid. */
export interface PrivatePlayerState {
  role: RoleKey;
  initialRole: RoleKey;
  potions: { heal: boolean; poison: boolean };
}

export interface NightActions {
  protect?: Record<string, string>;
  wolves?: Record<string, string>;
  witchSave?: Record<string, string>;
  witchKill?: Record<string, string>;
  muter?: Record<string, string>;
  cursedTransformed?: Record<string, true>;
}
