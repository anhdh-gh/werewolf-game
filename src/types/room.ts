export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";

export const OPTIONAL_ROLE_KEYS = ["BODYGUARD", "CURSED", "MUTER", "TANNER"] as const;
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
