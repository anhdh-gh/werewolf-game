export type RoleKey =
  | "WEREWOLF"
  | "TRAITOR"
  | "SEER"
  | "SORCERER"
  | "WITCH"
  | "BODYGUARD"
  | "HUNTER"
  | "CUPID"
  | "MUTER"
  | "CURSED"
  | "LYCAN"
  | "MASON"
  | "PRINCE"
  | "PACIFIST"
  | "WOLF_MAN"
  | "WOLF_CUB"
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
  SORCERER: "WOLF",
  WITCH: "VILLAGE",
  BODYGUARD: "VILLAGE",
  HUNTER: "VILLAGE",
  CUPID: "VILLAGE",
  MUTER: "VILLAGE",
  CURSED: "VILLAGE",
  LYCAN: "VILLAGE",
  MASON: "VILLAGE",
  PRINCE: "VILLAGE",
  PACIFIST: "VILLAGE",
  WOLF_MAN: "WOLF",
  WOLF_CUB: "WOLF",
  TANNER: "TANNER",
  VILLAGER: "VILLAGE",
};

/** Spec §4.1: what the Seer's check reports for a role. Only WEREWOLF,
 * WOLF_CUB, and LYCAN read as wolf — TRAITOR and WOLF_MAN are wolf-faction
 * but read as villager, LYCAN is village-faction but reads as wolf. Wolf Cub
 * is a real wolf (unlike Wolf Man's "reads as villager" variant), so it
 * belongs in this set — Epic 3c story, catalog-sourced. Everything else
 * reads as villager. */
const SEER_SEES_AS_WOLF: ReadonlySet<RoleKey> = new Set(["WEREWOLF", "LYCAN", "WOLF_CUB"]);

export function seerCheck(role: RoleKey): "WOLF" | "VILLAGER" {
  return SEER_SEES_AS_WOLF.has(role) ? "WOLF" : "VILLAGER";
}

/** Roles that appear in each other's `packUids` (the "who else is a wolf"
 * list every pack member sees). Not the same as `FACTION_BY_ROLE === "WOLF"`:
 * SORCERER is wolf-faction but is a hidden ally who never learns the pack's
 * identity and is never shown to them either (story 2.1's explicit no-guess
 * design decision). */
const PACK_VISIBLE_ROLES: ReadonlySet<RoleKey> = new Set([
  "WEREWOLF",
  "TRAITOR",
  "WOLF_MAN",
  "WOLF_CUB",
]);

export function isPackVisible(role: RoleKey): boolean {
  return PACK_VISIBLE_ROLES.has(role);
}

export const PHASE_SEQUENCE = [
  "REVEAL_ROLE",
  "PAIR_LOVERS",
  "NIGHT_FALLS",
  "SEER",
  "SORCERER",
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
  SORCERER: "SORCERER",
  BODYGUARD: "BODYGUARD",
  MUTER: "MUTER",
  CURSED: "CURSED",
};

export interface GamePlayer {
  name: string;
  alive: boolean;
  muted: boolean;
}

/** Deliberately no `requiredActors` field: earlier this held every uid who
 * had to act this phase (e.g. every Werewolf during WOLVES) directly on the
 * public game object — any authenticated client could read it and, for
 * role-specific phases, that list *is* the role membership. The server
 * (advance route) recomputes who's required from /private on every call
 * instead of persisting it anywhere client-readable; each client
 * independently derives "is it my turn" from its own role via
 * requiredActorsForPhase(phase, {[myUid]: myRole}) — see GameScreen. */
export interface GamePhase {
  name: PhaseName;
  endsAt: number;
  version: number;
}

/** Deliberately just the winning faction — no role reveal, ever. Roles stay
 * private forever, even after the game ends (never sent, per §12's "đừng
 * gửi" principle applied to the one place the old app still leaked it). */
export interface GameResult {
  winner: Faction;
}

export interface Game {
  roomCode: string;
  startedAt: number;
  dayNumber: number;
  phase: GamePhase;
  players: Record<string, GamePlayer>;
  result?: GameResult;
  /** Who the Bodyguard protected last night (spec §4.1: can't repeat the
   * same target on consecutive nights). Public — it reveals nothing about
   * who the Bodyguard IS, only who was shielded, same as the death
   * announcement already does implicitly by omission. */
  lastProtectedUid?: string | null;
  /** Spec §4.3: DAWN's job is "công bố người chết" and VOTE_RESULT's is the
   * hang result — both already implicit via players/{uid}/alive flipping,
   * but a UX-only banner reading this is far clearer than expecting anyone
   * to diff the player list against memory. Written once at the exact
   * transition that resolved it (DAWN for the night, VOTE_RESULT for the
   * vote) and left alone otherwise — reveals nothing `players` doesn't
   * already reveal, since deaths are public regardless. */
  lastDeaths?: string[];
  /** Epic 3c (Wolf Cub / "Sói Con"): true for exactly the one WOLVES phase
   * right after Wolf Cub dies — the pack bites 2 victims that night instead
   * of 1 (top-2 of the same vote, not a separate "pick 2" flow — see the
   * story doc's design decision #1). Public, like lastProtectedUid: it says
   * nothing about who Wolf Cub was, only that the pack gets a bonus bite,
   * and Wolf Cub's death is already public via players/{uid}/alive anyway.
   * Set/read/cleared entirely at the route layer since planAdvance() is
   * pure and has no memory between calls. */
  wolfCubBonusNightPending?: boolean;
}

export interface SeerHint {
  targetUid: string;
  result: "WOLF" | "VILLAGER";
  dayNumber: number;
}

/** Epic 2 Story 2.1: the Sorcerer's own check history — same shape idea as
 * SeerHint, but a distinct type (result is boolean, not "WOLF"|"VILLAGER")
 * so it doesn't disturb any existing SeerHint-keyed exhaustiveness. */
export interface SorcererHint {
  targetUid: string;
  result: boolean;
  dayNumber: number;
}

/** Spec §0/§7: chat only exists for a "Chơi xa" room, in two scopes.
 * "village" is the public/day channel — every player in the game,
 * regardless of faction (mirrors §10's single shared Discussion call room).
 * "wolves" is the pack's own — see paths.ts's gameChatPath for why it lives
 * on a separate top-level tree rather than under games/{gameId}. */
export type ChatScope = "village" | "wolves";

export interface ChatMessage {
  uid: string;
  text: string;
  at: number;
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
  /** The Sorcerer's own check history — same push()-keyed-map shape as
   * `hints` above. Only ever present for a uid dealt the Sorcerer role. */
  sorcererHints?: Record<string, SorcererHint>;
  /** Spec §6.5: the wolves' current-night pick, written here (not anywhere
   * publicly readable) the moment the WOLVES phase ends, so the Witch can
   * decide whether to save them. null when the pack didn't agree on
   * anyone. Only ever present for a uid dealt the Witch role. */
  pendingWolfTarget?: string | null;
  /** Spec §7: "danh sách đồng bọn cho Sói" — every other wolf-faction uid
   * (WEREWOLF or TRAITOR), so the pack can coordinate who to bite. Only
   * ever present for a uid dealt a wolf-faction role. */
  packUids?: string[];
  /** Every other MASON uid, written once at role-dealing time (same pattern
   * as packUids above) — passive knowledge, no phase involved. Empty array
   * when this uid is the only Mason in the game (nobody else to know about),
   * never present for a non-Mason. */
  masonUids?: string[];
}

export interface NightActions {
  protect?: Record<string, string>;
  wolves?: Record<string, string>;
  witchSave?: Record<string, string>;
  witchKill?: Record<string, string>;
  muter?: Record<string, string>;
  cursedTransformed?: Record<string, true>;
}
