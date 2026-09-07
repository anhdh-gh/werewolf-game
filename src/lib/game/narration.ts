import type { Faction, PhaseName } from "@/types/game";

/**
 * Spec §8.3: the whole narration script pre-rendered to mp3 at build time —
 * no runtime TTS call, ever (the old app's Google Translate TTS route is
 * explicitly the thing NOT to repeat: network-dependent at the worst
 * possible moment, no cache, broke once on a misread role name). Kept
 * small by splicing short clips at playback instead of recording one file
 * per possible sentence: "đêm qua có N người chết" is prefix + a count
 * word + suffix, not 17 different full sentences.
 *
 * NOT LIVE-VERIFIED, differently from every other "not live-verified" item
 * in this codebase: this isn't blocked on Firebase credentials, it's
 * blocked on having no TTS engine at all in this sandbox (checked: no
 * espeak/festival/pico2wave, no Python TTS package, and calling an actual
 * TTS API from here would repeat the exact mistake this file's own first
 * paragraph says not to). The RTDB write/read plumbing below is real and
 * tested; SENTENCES' `text` field is the exact script whoever has TTS
 * access needs to render to `/public/audio/narration/{key}.mp3` — nothing
 * else needs to change once those files exist.
 */

export type NarrationSentenceKey =
  | "GAME_START"
  | "PAIR_LOVERS"
  | "NIGHT_FALLS"
  | "SEER"
  | "BODYGUARD"
  | "MUTER"
  | "WOLVES"
  | "WITCH_SAVE"
  | "WITCH_KILL"
  | "CURSED"
  | "DAWN_NO_DEATHS"
  | "DAWN_DEATHS_PREFIX"
  | "DAWN_DEATHS_SUFFIX"
  | "DISCUSSION"
  | "VOTE"
  | "VOTE_RESULT_NO_HANG"
  | "VOTE_RESULT_HANGED"
  | "GAME_END_VILLAGE"
  | "GAME_END_WOLF"
  | "GAME_END_TANNER";

export const NARRATION_SENTENCES: Record<NarrationSentenceKey, string> = {
  GAME_START: "Ván đấu bắt đầu. Xin mời tất cả nhắm mắt lại.",
  PAIR_LOVERS: "Thần Tình Yêu, xin hãy thức dậy và chọn một cặp đôi.",
  NIGHT_FALLS: "Đêm xuống, cả làng chìm vào giấc ngủ.",
  SEER: "Tiên Tri, xin hãy thức dậy và chọn một người để soi.",
  BODYGUARD: "Bảo Vệ, xin hãy thức dậy và chọn một người để che chở.",
  MUTER: "Kẻ Bịt Miệng, xin hãy thức dậy và chọn một người.",
  WOLVES: "Bầy Sói, xin hãy thức dậy và chọn con mồi.",
  WITCH_SAVE: "Phù Thuỷ, xin hãy thức dậy. Bạn có muốn cứu nạn nhân đêm nay không?",
  WITCH_KILL: "Bạn có muốn dùng thuốc độc đêm nay không?",
  CURSED: "Trời sắp sáng.",
  DAWN_NO_DEATHS: "Trời đã sáng. Đêm qua không có ai chết.",
  DAWN_DEATHS_PREFIX: "Trời đã sáng. Đêm qua có",
  DAWN_DEATHS_SUFFIX: "người đã chết.",
  DISCUSSION: "Cả làng hãy cùng thảo luận.",
  VOTE: "Đến giờ bỏ phiếu.",
  VOTE_RESULT_NO_HANG: "Cả làng bỏ phiếu hoà, không ai bị treo cổ.",
  VOTE_RESULT_HANGED: "Một người vừa bị treo cổ.",
  GAME_END_VILLAGE: "Phe Làng đã chiến thắng!",
  GAME_END_WOLF: "Phe Sói đã chiến thắng!",
  GAME_END_TANNER: "Chán Đời đã chiến thắng!",
};

/** 0-16 as their own tiny clips (spec §4.2's max player count is 16, so
 * that's the ceiling for "how many died in one night"), spliced after
 * DAWN_DEATHS_PREFIX and before DAWN_DEATHS_SUFFIX. */
export const NARRATION_COUNT_WORDS: readonly string[] = [
  "không",
  "một",
  "hai",
  "ba",
  "bốn",
  "năm",
  "sáu",
  "bảy",
  "tám",
  "chín",
  "mười",
  "mười một",
  "mười hai",
  "mười ba",
  "mười bốn",
  "mười lăm",
  "mười sáu",
];

export const narrationSentencePath = (key: NarrationSentenceKey): string =>
  `/audio/narration/${key}.mp3`;
export const narrationCountPath = (count: number): string => `/audio/narration/count-${count}.mp3`;

/** Every phase that has exactly one matching announcement, no extra
 * params — DAWN and VOTE_RESULT are handled separately by the route since
 * they need the resolved death count, and REVEAL_ROLE/ENDED aren't phase
 * *entries* this maps (ENDED's announcement is keyed by winner, written
 * separately; REVEAL_ROLE has no "you just entered this phase" narration
 * of its own — GAME_START covers the very first moment instead). */
export const PHASE_NARRATION_KEY: Partial<Record<PhaseName, NarrationSentenceKey>> = {
  PAIR_LOVERS: "PAIR_LOVERS",
  NIGHT_FALLS: "NIGHT_FALLS",
  SEER: "SEER",
  BODYGUARD: "BODYGUARD",
  MUTER: "MUTER",
  WOLVES: "WOLVES",
  WITCH_SAVE: "WITCH_SAVE",
  WITCH_KILL: "WITCH_KILL",
  CURSED: "CURSED",
  DISCUSSION: "DISCUSSION",
  VOTE: "VOTE",
};

export const GAME_END_NARRATION_KEY: Record<Faction, NarrationSentenceKey> = {
  VILLAGE: "GAME_END_VILLAGE",
  WOLF: "GAME_END_WOLF",
  TANNER: "GAME_END_TANNER",
};

/** A single announcement written to games/{gameId}/narration/{seq}. `count`
 * is only ever present alongside DAWN_DEATHS_PREFIX (spliced with a count
 * word before DAWN_DEATHS_SUFFIX plays) — every other key is a single
 * fixed clip. */
export interface NarrationEvent {
  key: NarrationSentenceKey;
  count?: number;
  at: number;
}
