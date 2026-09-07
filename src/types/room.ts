export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";

// Order matches the fill priority in spec §4.2: Wolf/Village roles are dealt
// out before the sole Riêng (solo) role, TANNER, which always comes last.
export const OPTIONAL_ROLE_KEYS = [
  "BODYGUARD",
  "TRAITOR",
  "HUNTER",
  "CUPID",
  "MUTER",
  "CURSED",
  "LYCAN",
  "TANNER",
] as const;
export type OptionalRoleKey = (typeof OPTIONAL_ROLE_KEYS)[number];

export interface RoomSettings {
  maxPlayers: number;
  rolesEnabled: Record<OptionalRoleKey, boolean>;
}

export interface RoomMember {
  name: string;
  photoURL: string | null;
  joinedAt: number;
  ready: boolean;
  online: boolean;
}

export interface Room {
  createdAt: number;
  status: RoomStatus;
  settings: RoomSettings;
  members: Record<string, RoomMember>;
  currentGameId?: string;
}

export interface Presence {
  online: boolean;
  lastSeen: number | object;
  roomCode: string | null;
}
