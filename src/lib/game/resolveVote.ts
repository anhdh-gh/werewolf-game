/**
 * Spec §4.5: alive players vote to hang someone or abstain (null ballot).
 * Most votes dies; a tie — including everyone abstaining — means nobody
 * dies. Unlike the old app, the winner is never decided by write order.
 */
export function resolveVote(ballots: Record<string, string | null>): string | null {
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

  return tied ? null : winner;
}
