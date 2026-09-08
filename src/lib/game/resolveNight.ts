export interface ResolveNightInput {
  /** The wolves' pack pick(s) for tonight — see tallyTopNVotes(). 0 elements
   * on an all-abstain/tied night, 1 on a normal night, 2 on a Wolf Cub bonus
   * night (Epic 3c). Each target is resolved independently: there is no
   * interaction between the two on a bonus night, same as bite vs. poison
   * already being independent below. */
  wolfTargets: string[];
  protectTarget: string | null;
  witchSaveTarget: string | null;
  witchPoisonTarget: string | null;
  cursedUids: string[];
  /** Cursed players who already transformed on a previous night — a second
   * bite kills them normally instead of transforming them again. */
  alreadyTransformedCursed: string[];
  /** Epic 1b (Diseased): true for the one night after the wolves bite the
   * Diseased player — the pack still picks a target this night (so no
   * indirect "we didn't get to bite" tell leaks their identity), but that
   * bite never kills. Cursed's transform-on-first-bite still applies even
   * when this is true (design doc §2.2 decision #5): the curse triggers on
   * being bitten, not on dying. Optional, defaults to false so every
   * existing call site is unaffected. */
  suppressBite?: boolean;
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
 * handled in its own branch that never consults wolfTargets/protectTarget.
 */
export function resolveNight(input: ResolveNightInput): ResolveNightResult {
  const {
    wolfTargets,
    protectTarget,
    witchSaveTarget,
    witchPoisonTarget,
    cursedUids,
    alreadyTransformedCursed,
    suppressBite = false,
  } = input;

  const deaths = new Set<string>();
  const transformed: string[] = [];

  for (const wolfTarget of wolfTargets) {
    const bittenSurvives = wolfTarget === protectTarget || wolfTarget === witchSaveTarget;
    if (bittenSurvives) continue;
    const isFirstCursedBite =
      cursedUids.includes(wolfTarget) && !alreadyTransformedCursed.includes(wolfTarget);
    if (isFirstCursedBite) {
      transformed.push(wolfTarget);
    } else if (!suppressBite) {
      deaths.add(wolfTarget);
    }
  }

  if (witchPoisonTarget !== null) {
    deaths.add(witchPoisonTarget);
  }

  return { deaths: [...deaths], transformed };
}

/** Spec §4.4 step 1, generalized for Epic 3c (Wolf Cub): the wolves' bite
 * target(s) are whichever uid(s) the pack's live votes favor, top-`n`. A tie
 * at the cutoff position resolves to stopping there — same "pack failed to
 * agree" spirit as the original n=1 tie-to-null behavior, just applied at
 * whichever rank the tie lands on. n=1 (tallyMajorityVote) is unaffected: a
 * tie for 1st still returns nobody, exactly as before. */
export function tallyTopNVotes(votes: Record<string, string>, n: number): string[] {
  const counts = new Map<string, number>();
  for (const target of Object.values(votes)) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const result: string[] = [];
  for (let i = 0; i < n && i < sorted.length; i++) {
    const [target, count] = sorted[i];
    const nextCount = sorted[i + 1]?.[1];
    if (count === nextCount) break;
    result.push(target);
  }
  return result;
}

/** Thin n=1 wrapper — every existing call site (planAdvance's normal night,
 * advance/route.ts's pendingWolfTarget for the Witch) keeps working
 * unchanged. Ties and an all-abstain night both resolve to "nobody bitten"
 * — the pack failed to agree. */
export function tallyMajorityVote(votes: Record<string, string>): string | null {
  return tallyTopNVotes(votes, 1)[0] ?? null;
}
