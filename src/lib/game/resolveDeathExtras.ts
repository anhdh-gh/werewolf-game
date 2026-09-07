/**
 * Spec §4.4 steps 7–8: two death effects that don't depend on who or what
 * caused the original death, applied after resolveNight/resolveVote produce
 * their raw death list.
 */

/** Step 7: if exactly one member of a Cupid pair is in `deaths`, the other
 * dies of heartbreak too — regardless of cause, regardless of faction. */
export function applyLoverDeaths(
  deaths: string[],
  lovers: readonly [string, string] | null,
): string[] {
  if (!lovers) return deaths;
  const [a, b] = lovers;
  const result = new Set(deaths);
  if (result.has(a) && !result.has(b)) result.add(b);
  else if (result.has(b) && !result.has(a)) result.add(a);
  return [...result];
}

/** Step 8: every dead Hunter's chosen target dies too. `hunterShots` should
 * only ever contain entries for uids who actually hold the Hunter role —
 * this function trusts its caller for that and only checks who's dead. */
export function applyHunterRevenge(
  deaths: string[],
  hunterShots: Record<string, string>,
): string[] {
  const result = new Set(deaths);
  for (const [hunterUid, targetUid] of Object.entries(hunterShots)) {
    if (result.has(hunterUid)) result.add(targetUid);
  }
  return [...result];
}

/** Runs both effects, then re-applies lover heartbreak once more — a
 * Hunter's shot can kill someone whose lover then also needs to die
 * (spec §4.4 step 8's explicit "kéo theo người yêu" case). Idempotent: a
 * second pass over an already-resolved list changes nothing. */
export function applyDeathExtras(
  rawDeaths: string[],
  lovers: readonly [string, string] | null,
  hunterShots: Record<string, string>,
): string[] {
  const afterLovers = applyLoverDeaths(rawDeaths, lovers);
  const afterHunter = applyHunterRevenge(afterLovers, hunterShots);
  return applyLoverDeaths(afterHunter, lovers);
}
