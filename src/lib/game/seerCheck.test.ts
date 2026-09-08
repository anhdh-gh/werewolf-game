import { describe, it, expect } from "vitest";
import { seerCheck } from "@/types/game";
import type { RoleKey } from "@/types/game";

describe("seerCheck", () => {
  it("reads real wolves as WOLF", () => {
    expect(seerCheck("WEREWOLF")).toBe("WOLF");
  });

  it("reads the Traitor as VILLAGER even though they're wolf-faction (spec §4.1)", () => {
    expect(seerCheck("TRAITOR")).toBe("VILLAGER");
  });

  it("reads the Lycan as WOLF even though they're village-faction (spec §4.1)", () => {
    expect(seerCheck("LYCAN")).toBe("WOLF");
  });

  it("reads the Wolf Man as VILLAGER even though they're wolf-faction and act with the pack", () => {
    expect(seerCheck("WOLF_MAN")).toBe("VILLAGER");
  });

  it("reads every other role as VILLAGER", () => {
    const others: RoleKey[] = [
      "SEER",
      "WITCH",
      "BODYGUARD",
      "HUNTER",
      "CUPID",
      "MUTER",
      "CURSED",
      "TANNER",
      "VILLAGER",
    ];
    for (const role of others) {
      expect(seerCheck(role)).toBe("VILLAGER");
    }
  });
});
