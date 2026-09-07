export interface ResolveNightInput {
  /** Already the wolves' pack majority pick — see tallyMajorityVote(). */
  wolfTarget: string | null;
  protectTarget: string | null;
  witchSaveTarget: string | null;
  witchPoisonTarget: string | null;
  cursedUids: string[];
  /** Cursed players who already transformed on a previous night — a second
   * bite kills them normally instead of transforming them again. */
  alreadyTransformedCursed: string[];
}

export interface ResolveNightResult {
  deaths: string[];
  transformed: string[];
}

/**
 * Spec §4.4, applied as sequential conditional steps — never set subtraction.
 * The old app computed deaths as {bite, poison} − {protect, cure}, which let
 * a protect/cure targeting someone ELSE's poison victim accidentally save
 * them. Poison is independent of protect/cure by construction here: it's
 * handled in its own branch that never consults wolfTarget/protectTarget.
 */
export function resolveNight(input: ResolveNightInput): ResolveNightResult {
  const {
    wolfTarget,
    protectTarget,
    witchSaveTarget,
    witchPoisonTarget,
    cursedUids,
    alreadyTransformedCursed,
  } = input;

  const deaths = new Set<string>();
  const transformed: string[] = [];

  if (wolfTarget !== null) {
    const bittenSurvives = wolfTarget === protectTarget || wolfTarget === witchSaveTarget;
    if (!bittenSurvives) {
      const isFirstCursedBite =
        cursedUids.includes(wolfTarget) && !alreadyTransformedCursed.includes(wolfTarget);
      if (isFirstCursedBite) {
        transformed.push(wolfTarget);
      } else {
        deaths.add(wolfTarget);
      }
    }
  }

  if (witchPoisonTarget !== null) {
    deaths.add(witchPoisonTarget);
  }

  return { deaths: [...deaths], transformed };
}

/** Spec §4.4 step 1: the wolves' bite target is whichever uid the pack's
 * live votes favor. Ties and an all-abstain night both resolve to "nobody
 * bitten" — the pack failed to agree. */
export function tallyMajorityVote(votes: Record<string, string>): string | null {
  const counts = new Map<string, number>();
  for (const target of Object.values(votes)) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  let winner: string | null = null;
  let winnerVotes = 0;
  let tied = false;
  for (const [target, count] of counts) {
    if (count > winnerVotes) {
      winner = target;
      winnerVotes = count;
      tied = false;
    } else if (count === winnerVotes) {
      tied = true;
    }
  }

  return tied ? null : winner;
}
