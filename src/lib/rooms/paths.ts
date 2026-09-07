export const roomPath = (code: string): string => `rooms/${code}`;
export const roomMembersPath = (code: string): string => `rooms/${code}/members`;
export const roomMemberPath = (code: string, uid: string): string =>
  `rooms/${code}/members/${uid}`;
export const roomSettingsPath = (code: string): string => `rooms/${code}/settings`;
export const roomStatusPath = (code: string): string => `rooms/${code}/status`;
export const presencePath = (uid: string): string => `presence/${uid}`;

// Its own top-level tree, not nested under presence/{uid} — attachPresence
// writes the whole presence node with set() (replace, not merge) every time
// a client (re)connects, which would silently wipe out an fcmToken stored
// there. No client ever needs to READ another uid's token (or even their
// own back) — only the Admin SDK sends notifications, and it bypasses
// Security Rules entirely — so there's deliberately no .read rule for this
// at all, just self-write.
export const fcmTokenPath = (uid: string): string => `fcmTokens/${uid}`;
