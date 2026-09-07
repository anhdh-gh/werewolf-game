import type { Faction, PhaseName, RoleKey } from "@/types/game";
import { nextPhase } from "./phases";
import { resolveNight, tallyMajorityVote } from "./resolveNight";
import { resolveVote } from "./resolveVote";
import { applyDeathExtras } from "./resolveDeathExtras";
import { checkWinner } from "./checkWinner";

export interface PlanAdvanceInput {
  currentPhase: PhaseName;
  /** Roles actually dealt into this game — drives nextPhase's skip logic. */
  activeRoles: RoleKey[];
  /** uid -> role, for everyone alive going into this transition. */
  aliveRolesByUid: Record<string, RoleKey>;
  actions: {
    protectTarget: string | null;
    wolfVotes: Record<string, string>;
    witchSaveTarget: string | null;
    witchPoisonTarget: string | null;
    voteBallots: Record<string, string | null>;
    hunterShots: Record<string, string>;
  };
  cursedUids: string[];
  alreadyTransformedCursed: string[];
  lovers: readonly [string, string] | null;
}

export interface PlanAdvanceResult {
  /** "ENDED" whenever a winner is decided, overriding whatever nextPhase()
   * would otherwise have said. */
  nextPhase: PhaseName;
  deaths: string[];
  transformedToWolf: string[];
  winner: Faction | null;
}

/**
 * The one function every call to POST /api/games/[gameId]/advance runs.
 * Pure and Firebase-free by design (see the Game Engine plan's Global
 * Constraints) — the route is a thin adapter that reads state into this
 * shape, calls this, and writes the result back.
 *
 * Resolution happens exactly at the two points spec §4.4/§4.5 describe:
 * leaving the last active night phase (whatever it is, once activeRoles'
 * skip logic is applied, that's whatever phase transitions to DAWN) runs
 * the night engine; leaving VOTE runs the day vote. Every other transition
 * just advances the phase clock.
 */
export function planAdvance(input: PlanAdvanceInput): PlanAdvanceResult {
  const next = nextPhase(input.currentPhase, input.activeRoles);

  let deaths: string[] = [];
  let transformedToWolf: string[] = [];

  if (next === "DAWN") {
    const wolfTarget = tallyMajorityVote(input.actions.wolfVotes);
    const nightResult = resolveNight({
      wolfTarget,
      protectTarget: input.actions.protectTarget,
      witchSaveTarget: input.actions.witchSaveTarget,
      witchPoisonTarget: input.actions.witchPoisonTarget,
      cursedUids: input.cursedUids,
      alreadyTransformedCursed: input.alreadyTransformedCursed,
    });
    deaths = applyDeathExtras(nightResult.deaths, input.lovers, input.actions.hunterShots);
    transformedToWolf = nightResult.transformed;
  } else if (next === "VOTE_RESULT") {
    const hanged = resolveVote(input.actions.voteBallots);
    deaths = applyDeathExtras(hanged ? [hanged] : [], input.lovers, input.actions.hunterShots);
  }

  const deadUids = new Set(deaths);
  const transformedSet = new Set(transformedToWolf);
  const aliveRoles: RoleKey[] = [];
  const deathsThisRoundRoles: RoleKey[] = [];

  for (const [uid, role] of Object.entries(input.aliveRolesByUid)) {
    if (deadUids.has(uid)) {
      deathsThisRoundRoles.push(role);
    } else {
      aliveRoles.push(transformedSet.has(uid) ? "WEREWOLF" : role);
    }
  }

  const winner = checkWinner({ deathsThisRoundRoles, aliveRoles });

  return { nextPhase: winner ? "ENDED" : next, deaths, transformedToWolf, winner };
}
