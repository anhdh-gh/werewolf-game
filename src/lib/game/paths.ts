export const gamePath = (gameId: string): string => `games/${gameId}`;
export const gamePhasePath = (gameId: string): string => `games/${gameId}/phase`;
export const gamePlayerPath = (gameId: string, uid: string): string =>
  `games/${gameId}/players/${uid}`;
export const gameResultPath = (gameId: string): string => `games/${gameId}/result`;
export const gameActionsPath = (gameId: string, phaseKey: string): string =>
  `games/${gameId}/actions/${phaseKey}`;
export const gameActionPath = (gameId: string, phaseKey: string, uid: string): string =>
  `games/${gameId}/actions/${phaseKey}/${uid}`;
export const privatePlayerPath = (gameId: string, uid: string): string =>
  `private/${gameId}/${uid}`;
