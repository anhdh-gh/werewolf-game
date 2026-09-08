import { deckSize } from "@/types/room";
import { FACTION_BY_ROLE, type RoleKey } from "@/types/game";

/** Deck-builder change (2026-09-08): the room creator decides exactly how
 * many of each role to deal — no more auto-computed formula. Order doesn't
 * matter here; assignRoles shuffles the result before dealing it out. */
export function buildRoleList(roleCounts: Record<RoleKey, number>): RoleKey[] {
  const roles: RoleKey[] = [];
  for (const [role, count] of Object.entries(roleCounts) as [RoleKey, number][]) {
    for (let i = 0; i < count; i++) roles.push(role);
  }
  return roles;
}

/** The one hard guardrail the owner kept when everything else about the old
 * auto-fill formula (always Seer/Witch/≥1 Villager) was dropped: a deck with
 * zero Wolf-faction roles can never be started. Non-throwing so the UI can
 * show the same message as a live warning; assertValidDeck below is the
 * throwing wrapper the server route uses. */
export function deckIssue(roleCounts: Record<RoleKey, number>): string | null {
  const size = deckSize(roleCounts);
  if (size < 4) return "Cần ít nhất 4 người chơi";
  if (size > 16) return "Tối đa 16 người chơi";

  const wolfCount = (Object.entries(roleCounts) as [RoleKey, number][])
    .filter(([role]) => FACTION_BY_ROLE[role] === "WOLF")
    .reduce((sum, [, n]) => sum + n, 0);
  if (wolfCount < 1) return "Deck phải có ít nhất một vai phe Sói";

  return null;
}

export function assertValidDeck(roleCounts: Record<RoleKey, number>): void {
  const issue = deckIssue(roleCounts);
  if (issue) throw new Error(issue);
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Story 1.1 (Mason): pure, Firebase-free pairing of every MASON uid with
 * every other MASON uid, so the caller (start route) can write it straight
 * into each Mason's private state. Empty array for a solo Mason — nobody
 * else to know about, still a valid (not missing) field. */
export function buildMasonLinks(assignment: Record<string, RoleKey>): Record<string, string[]> {
  const masonUids = Object.entries(assignment)
    .filter(([, role]) => role === "MASON")
    .map(([uid]) => uid);

  const links: Record<string, string[]> = {};
  for (const uid of masonUids) {
    links[uid] = masonUids.filter((other) => other !== uid);
  }
  return links;
}

/** Who gets which role among uids stays random and hidden, exactly as
 * before — only the input (an explicit deck instead of a formula-computed
 * one) changed. Caller is responsible for making sure uids.length matches
 * deckSize(roleCounts) (see the start route's own check) — this function
 * doesn't re-validate that. */
export function assignRoles(
  uids: string[],
  roleCounts: Record<RoleKey, number>,
): Record<string, RoleKey> {
  const roles = shuffle(buildRoleList(roleCounts));
  const assignment: Record<string, RoleKey> = {};
  uids.forEach((uid, i) => {
    assignment[uid] = roles[i];
  });
  return assignment;
}
