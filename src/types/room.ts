import type { RoleKey } from "@/types/game";

export type RoomStatus = "LOBBY" | "PLAYING" | "ENDED";

export interface RoomSettings {
  /** Deck-builder change (2026-09-08): the room creator decides exactly how
   * many of each role are in play — no more auto-computed formula. There is
   * no separate "maxPlayers" field anymore; the target player count IS the
   * deck total (see deckSize below), so the two can never drift apart. */
  roleCounts: Record<RoleKey, number>;
  /** Spec §0/§3: "Chơi xa" — off by default (ngồi cùng bàn thì nói bằng
   * miệng). Gates chat, the auto-joined LiveKit call rooms, and mic/cam
   * publish permission (§4.7, §10) — none of that exists for a room that
   * never turns this on. */
  remoteMode: boolean;
}

/** Single source of truth for "how many players this deck is built for" —
 * every place that used to read a separately-stored maxPlayers now derives
 * it from the deck itself instead. */
export function deckSize(roleCounts: Record<RoleKey, number>): number {
  return Object.values(roleCounts).reduce((sum, n) => sum + n, 0);
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
