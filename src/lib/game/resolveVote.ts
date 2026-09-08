import type { RoleKey } from "@/types/game";

/**
 * Spec §4.5: alive players vote to hang someone or abstain (null ballot).
 * Most votes dies; a tie — including everyone abstaining — means nobody
 * dies. Unlike the old app, the winner is never decided by write order.
 *
 * Story 1.2 (Prince): a Prince who would otherwise hang is spared instead —
 * the vote resolves exactly like a tie (nobody dies, no signal to the
 * village), preserving spec §4.6's "roles are never revealed" invariant
 * instead of the source card's original "identity is revealed" wording.
 * `roleOf` is optional so every pre-existing call/test unrelated to Prince
 * is unaffected.
 */
export function resolveVote(
  ballots: Record<string, string | null>,
  roleOf: Record<string, RoleKey> = {},
): string | null {
  const counts = new Map<string, number>();
  for (const target of Object.values(ballots)) {
    if (target === null) continue;
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

  const hanged = tied ? null : winner;
  return hanged !== null && roleOf[hanged] === "PRINCE" ? null : hanged;
}
