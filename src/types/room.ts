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
  "MASON",
  "PRINCE",
  "TANNER",
] as const;
export type OptionalRoleKey = (typeof OPTIONAL_ROLE_KEYS)[number];

export interface RoomSettings {
  maxPlayers: number;
  rolesEnabled: Record<OptionalRoleKey, boolean>;
  /** Spec §0/§3: "Chơi xa" — off by default (ngồi cùng bàn thì nói bằng
   * miệng). Gates chat, the auto-joined LiveKit call rooms, and mic/cam
   * publish permission (§4.7, §10) — none of that exists for a room that
   * never turns this on. */
  remoteMode: boolean;
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
