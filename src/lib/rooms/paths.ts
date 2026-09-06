export const roomPath = (code: string): string => `rooms/${code}`;
export const roomMembersPath = (code: string): string => `rooms/${code}/members`;
export const roomMemberPath = (code: string, uid: string): string =>
  `rooms/${code}/members/${uid}`;
export const roomSettingsPath = (code: string): string => `rooms/${code}/settings`;
export const roomStatusPath = (code: string): string => `rooms/${code}/status`;
export const presencePath = (uid: string): string => `presence/${uid}`;
