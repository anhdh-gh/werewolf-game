import { describe, it, expect } from "vitest";
import { nextPhase, PHASE_DURATIONS_MS } from "./phases";
import type { PhaseName, RoleKey } from "@/types/game";

const ALL_ROLES: RoleKey[] = [
  "WEREWOLF",
  "TRAITOR",
  "SEER",
  "WITCH",
  "BODYGUARD",
  "HUNTER",
  "CUPID",
  "MUTER",
  "CURSED",
  "LYCAN",
  "TANNER",
  "VILLAGER",
];

const MINIMAL_ROLES: RoleKey[] = ["WEREWOLF", "SEER", "WITCH", "VILLAGER"];

describe("nextPhase", () => {
  it("walks the full sequence in order when every role is in the game, pairing lovers first", () => {
    let phase: PhaseName = "REVEAL_ROLE";
    const seen: PhaseName[] = [phase];
    for (let i = 0; i < 13; i++) {
      phase = nextPhase(phase, ALL_ROLES);
      seen.push(phase);
    }
    expect(seen).toEqual([
      "REVEAL_ROLE",
      "PAIR_LOVERS",
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

  it("skips PAIR_LOVERS entirely when there is no Cupid in the game", () => {
    expect(nextPhase("REVEAL_ROLE", MINIMAL_ROLES)).toBe("NIGHT_FALLS");
  });

  it("never re-enters PAIR_LOVERS or REVEAL_ROLE once the loop is running, even with Cupid in the game", () => {
    expect(nextPhase("VOTE_RESULT", ALL_ROLES)).toBe("NIGHT_FALLS");
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

  it("SORCERER slots in right after SEER when a Sorcerer is in the game", () => {
    const withSorcerer: RoleKey[] = ["WEREWOLF", "SEER", "SORCERER", "WITCH", "VILLAGER"];
    expect(nextPhase("SEER", withSorcerer)).toBe("SORCERER");
    expect(nextPhase("SORCERER", withSorcerer)).toBe("WOLVES");
  });

  it("skips SORCERER entirely when there is no Sorcerer in the game", () => {
    expect(nextPhase("SEER", MINIMAL_ROLES)).toBe("WOLVES");
  });

  it("has a duration for every phase", () => {
    for (const phase of Object.keys(PHASE_DURATIONS_MS)) {
      expect(PHASE_DURATIONS_MS[phase as keyof typeof PHASE_DURATIONS_MS]).toBeGreaterThan(0);
    }
  });
});
