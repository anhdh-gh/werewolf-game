import type { Faction, PhaseName, RoleKey } from "@/types/game";
import { nextPhase } from "./phases";
import { resolveNight, tallyTopNVotes } from "./resolveNight";
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
  /** Epic 3c (Wolf Cub): true when this DAWN resolution is the one bonus
   * night after Wolf Cub died — the pack bites top-2 of the vote instead of
   * top-1. Ignored outside a DAWN resolution. */
  wolfCubBonusNightPending: boolean;
  /** Epic 1b (Diseased): true when this DAWN resolution is the one night
   * after the wolves bit the Diseased player — tonight's bite is voided
   * (see resolveNight's suppressBite). Ignored outside a DAWN resolution. */
  diseasedSuppressNextBite: boolean;
}

export interface PlanAdvanceResult {
  /** "ENDED" whenever a winner is decided, overriding whatever nextPhase()
   * would otherwise have said. */
  nextPhase: PhaseName;
  deaths: string[];
  transformedToWolf: string[];
  winner: Faction | null;
  /** Roles of everyone who died this call (night bite/poison or day hang) —
   * exposed so the route can check "did Wolf Cub just die?" without
   * recomputing this itself from decision.deaths + aliveRolesByUid. */
  deathsThisRoundRoles: RoleKey[];
  /** Epic 1b (Diseased): the new value to persist for the *next* DAWN's
   * `diseasedSuppressNextBite` input — true iff tonight's wolf bite
   * actually landed on the (still-alive) Diseased player and wasn't saved
   * by Bodyguard/Witch, regardless of whether suppression zeroed out the
   * death itself. Only meaningful when `nextPhase` resolved via DAWN;
   * false on every other transition (route only writes it on DAWN). */
  diseasedSuppressNextBite: boolean;
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
  let diseasedSuppressNextBite = false;

  if (next === "DAWN") {
    const wolfTargets = tallyTopNVotes(
      input.actions.wolfVotes,
      input.wolfCubBonusNightPending ? 2 : 1,
    );
    const nightResult = resolveNight({
      wolfTargets,
      protectTarget: input.actions.protectTarget,
      witchSaveTarget: input.actions.witchSaveTarget,
      witchPoisonTarget: input.actions.witchPoisonTarget,
      cursedUids: input.cursedUids,
      alreadyTransformedCursed: input.alreadyTransformedCursed,
      suppressBite: input.diseasedSuppressNextBite,
    });
    deaths = applyDeathExtras(nightResult.deaths, input.lovers, input.actions.hunterShots);
    transformedToWolf = nightResult.transformed;

    const diseasedUid = Object.entries(input.aliveRolesByUid).find(
      ([, role]) => role === "DISEASED",
    )?.[0];
    diseasedSuppressNextBite =
      diseasedUid !== undefined &&
      wolfTargets.includes(diseasedUid) &&
      diseasedUid !== input.actions.protectTarget &&
      diseasedUid !== input.actions.witchSaveTarget;
  } else if (next === "VOTE_RESULT") {
    const hanged = resolveVote(input.actions.voteBallots, input.aliveRolesByUid);
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

  return {
    nextPhase: winner ? "ENDED" : next,
    deaths,
    transformedToWolf,
    winner,
    deathsThisRoundRoles,
    diseasedSuppressNextBite,
  };
}
