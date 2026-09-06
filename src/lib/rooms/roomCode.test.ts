import { describe, it, expect } from "vitest";
import { generateRoomCode, ROOM_CODE_ALPHABET } from "./roomCode";

describe("generateRoomCode", () => {
  it("generates a 6-character code by default", () => {
    expect(generateRoomCode()).toHaveLength(6);
  });

  it("generates a code of the requested length", () => {
    expect(generateRoomCode(8)).toHaveLength(8);
  });

  it("only uses characters from the safe alphabet", () => {
    const code = generateRoomCode(50);
    for (const char of code) {
      expect(ROOM_CODE_ALPHABET).toContain(char);
    }
  });

  it("excludes ambiguous characters", () => {
    for (const ambiguous of ["0", "O", "1", "I"]) {
      expect(ROOM_CODE_ALPHABET).not.toContain(ambiguous);
    }
  });
});
