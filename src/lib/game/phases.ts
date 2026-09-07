import { PHASE_SEQUENCE, PHASE_OPTIONAL_ROLE, type PhaseName, type RoleKey } from "@/types/game";

/** REVEAL_ROLE and PAIR_LOVERS only ever happen once, at game start (spec
 * §4.3) — they are not part of the repeating night/day loop, so they're
 * excluded here and handled as special-cased transitions below instead. */
const LOOP: PhaseName[] = PHASE_SEQUENCE.filter(
  (phase) => phase !== "REVEAL_ROLE" && phase !== "PAIR_LOVERS",
);

/** Spec §4.3's default durations. DAWN and VOTE_RESULT are announcement-only
 * (no player action, nothing in PHASE_OPTIONAL_ROLE requires input there) and
 * the spec doesn't give them an explicit second count — 8s is a placeholder
 * long enough for the narration line to play, tune once real audio exists. */
export const PHASE_DURATIONS_MS: Record<PhaseName, number> = {
  REVEAL_ROLE: 20_000,
  PAIR_LOVERS: 20_000,
  NIGHT_FALLS: 8_000,
  SEER: 30_000,
  BODYGUARD: 30_000,
  MUTER: 30_000,
  WOLVES: 40_000,
  WITCH_SAVE: 30_000,
  WITCH_KILL: 30_000,
  CURSED: 15_000,
  DAWN: 8_000,
  DISCUSSION: 180_000,
  VOTE: 60_000,
  VOTE_RESULT: 8_000,
  ENDED: 20_000,
};

/** Spec §4.3: a role's phase is skipped entirely when that role isn't in the
 * game at all (not merely disabled in settings — `activeRoles` is the actual
 * dealt role list). Wolves/Seer/Witch are always present, so only the
 * optional-role phases in PHASE_OPTIONAL_ROLE can be skipped. Looping past
 * VOTE_RESULT lands back on NIGHT_FALLS for the next day. */
export function nextPhase(current: PhaseName, activeRoles: RoleKey[]): PhaseName {
  if (current === "REVEAL_ROLE") {
    return activeRoles.includes("CUPID") ? "PAIR_LOVERS" : "NIGHT_FALLS";
  }
  if (current === "PAIR_LOVERS") return "NIGHT_FALLS";
  if (current === "ENDED") return "ENDED";

  let idx = LOOP.indexOf(current);
  for (let step = 0; step < LOOP.length; step++) {
    idx = (idx + 1) % LOOP.length;
    const candidate = LOOP[idx];
    const requiredRole = PHASE_OPTIONAL_ROLE[candidate];
    if (!requiredRole || activeRoles.includes(requiredRole)) {
      return candidate;
    }
  }
  return current;
}
