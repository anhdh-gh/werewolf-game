import { describe, it, expect } from "vitest";
import { nextPhase, PHASE_DURATIONS_MS } from "./phases";
import type { PhaseName, RoleKey } from "@/types/game";

const ALL_ROLES: RoleKey[] = [
  "WEREWOLF",
  "SEER",
  "WITCH",
  "BODYGUARD",
  "MUTER",
  "CURSED",
  "TANNER",
  "VILLAGER",
];

const MINIMAL_ROLES: RoleKey[] = ["WEREWOLF", "SEER", "WITCH", "VILLAGER"];

describe("nextPhase", () => {
  it("walks the full sequence in order when every role is in the game", () => {
    let phase: PhaseName = "REVEAL_ROLE";
    const seen: PhaseName[] = [phase];
    for (let i = 0; i < 12; i++) {
      phase = nextPhase(phase, ALL_ROLES);
      seen.push(phase);
    }
    expect(seen).toEqual([
      "REVEAL_ROLE",
      "NIGHT_FALLS",
      "SEER",
      "BODYGUARD",
      "MUTER",
      "WOLVES",
      "WITCH_SAVE",
      "WITCH_KILL",
      "CURSED",
      "DAWN",
      "DISCUSSION",
      "VOTE",
      "VOTE_RESULT",
    ]);
  });

  it("skips a role's phase entirely when that role isn't in the game", () => {
    expect(nextPhase("NIGHT_FALLS", MINIMAL_ROLES)).toBe("SEER");
    expect(nextPhase("SEER", MINIMAL_ROLES)).toBe("WOLVES");
    expect(nextPhase("WOLVES", MINIMAL_ROLES)).toBe("WITCH_SAVE");
    expect(nextPhase("WITCH_KILL", MINIMAL_ROLES)).toBe("DAWN");
  });

  it("loops from VOTE_RESULT back to NIGHT_FALLS for the next day", () => {
    expect(nextPhase("VOTE_RESULT", ALL_ROLES)).toBe("NIGHT_FALLS");
  });

  it("has a duration for every phase except VOTE_RESULT and ENDED (which advance immediately)", () => {
    for (const phase of Object.keys(PHASE_DURATIONS_MS)) {
      expect(PHASE_DURATIONS_MS[phase as keyof typeof PHASE_DURATIONS_MS]).toBeGreaterThan(0);
    }
  });
});
