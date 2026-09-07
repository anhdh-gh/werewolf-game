export const gamePath = (gameId: string): string => `games/${gameId}`;
export const gamePhasePath = (gameId: string): string => `games/${gameId}/phase`;
export const gamePlayerPath = (gameId: string, uid: string): string =>
  `games/${gameId}/players/${uid}`;
export const gameResultPath = (gameId: string): string => `games/${gameId}/result`;

// Deliberately a separate top-level tree from games/{gameId}, not nested
// under it. RTDB grants read access by walking from the requested path UP
// to root and stopping at the first rule that allows it — games/$gameId's
// own ".read": "auth != null" would otherwise apply to anything nested
// under it too, including a role-specific action like actions/SEER/{uid},
// whose mere existence identifies {uid} as the Seer. Keeping this tree
// separate is what lets it carry its own, much stricter default (see
// database.rules.json: self-read-only except VOTE).
export const gameActionsPath = (gameId: string, phaseKey: string): string =>
  `actions/${gameId}/${phaseKey}`;
export const gameActionPath = (gameId: string, phaseKey: string, uid: string): string =>
  `actions/${gameId}/${phaseKey}/${uid}`;

export const privatePlayerPath = (gameId: string, uid: string): string =>
  `private/${gameId}/${uid}`;

// Same reasoning as actions/ above: a separate top-level tree, not nested
// under games/{gameId}, specifically so the wolves' chat can carry its own
// stricter-than-games read rule (only wolf-faction uids) without
// games/$gameId's ".read": "auth != null" cascading down and overriding it.
// village doesn't strictly need this (it's meant to be readable by every
// player in the game anyway), but keeping both scopes on the same tree
// avoids a third top-level root just for symmetry.
export const gameChatPath = (gameId: string, scope: "village" | "wolves"): string =>
  `chat/${gameId}/${scope}`;
