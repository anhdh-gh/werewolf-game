export const ROOM_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateRoomCode(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[index];
  }
  return code;
}
