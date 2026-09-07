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
