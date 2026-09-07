import { describe, it, expect } from "vitest";
import { wolfCount, buildRoleList, assignRoles } from "./roles";
import type { OptionalRoleKey } from "@/types/room";

const ALL_ENABLED: Record<OptionalRoleKey, boolean> = {
  BODYGUARD: true,
  CURSED: true,
  MUTER: true,
  TANNER: true,
};

const ALL_DISABLED: Record<OptionalRoleKey, boolean> = {
  BODYGUARD: false,
  CURSED: false,
  MUTER: false,
  TANNER: false,
};

function countRoles(roles: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const role of roles) counts[role] = (counts[role] ?? 0) + 1;
  return counts;
}

describe("wolfCount", () => {
  it("follows floor((n-1)/4)+1 for every valid room size", () => {
    expect(wolfCount(4)).toBe(1);
    expect(wolfCount(5)).toBe(2);
    expect(wolfCount(8)).toBe(2);
    expect(wolfCount(9)).toBe(3);
    expect(wolfCount(12)).toBe(3);
    expect(wolfCount(13)).toBe(4);
    expect(wolfCount(16)).toBe(4);
  });
});

describe("buildRoleList", () => {
  it("rejects fewer than 4 or more than 16 players", () => {
    expect(() => buildRoleList(3, ALL_ENABLED)).toThrow(/4 đến 16/);
    expect(() => buildRoleList(17, ALL_ENABLED)).toThrow(/4 đến 16/);
  });

  it("at the 4-player floor: 1 wolf, seer, witch, 1 villager — no optional roles fit", () => {
    const roles = buildRoleList(4, ALL_ENABLED);
    expect(roles).toHaveLength(4);
    expect(countRoles(roles)).toEqual({ WEREWOLF: 1, SEER: 1, WITCH: 1, VILLAGER: 1 });
  });

  it("at 8 players with everything enabled, fills Bodyguard/Cursed/Muter before running out of slots", () => {
    const roles = buildRoleList(8, ALL_ENABLED);
    expect(roles).toHaveLength(8);
    expect(countRoles(roles)).toEqual({
      WEREWOLF: 2,
      SEER: 1,
      WITCH: 1,
      BODYGUARD: 1,
      CURSED: 1,
      MUTER: 1,
      VILLAGER: 1,
    });
  });

  it("at 16 players with everything enabled, every optional role appears exactly once", () => {
    const roles = buildRoleList(16, ALL_ENABLED);
    expect(roles).toHaveLength(16);
    expect(countRoles(roles)).toEqual({
      WEREWOLF: 4,
      SEER: 1,
      WITCH: 1,
      BODYGUARD: 1,
      CURSED: 1,
      MUTER: 1,
      TANNER: 1,
      VILLAGER: 6,
    });
  });

  it("skips disabled optional roles and backfills with villagers", () => {
    const roles = buildRoleList(8, ALL_DISABLED);
    expect(roles).toHaveLength(8);
    expect(countRoles(roles)).toEqual({ WEREWOLF: 2, SEER: 1, WITCH: 1, VILLAGER: 4 });
  });

  it("a disabled role's slot rolls over to the next enabled optional role, not straight to villager", () => {
    const roles = buildRoleList(8, { ...ALL_ENABLED, BODYGUARD: false });
    expect(roles).toHaveLength(8);
    expect(countRoles(roles)).toEqual({
      WEREWOLF: 2,
      SEER: 1,
      WITCH: 1,
      CURSED: 1,
      MUTER: 1,
      TANNER: 1,
      VILLAGER: 1,
    });
  });

  it("always includes at least one villager even when every optional role is enabled and would otherwise fit", () => {
    for (let n = 4; n <= 16; n++) {
      const counts = countRoles(buildRoleList(n, ALL_ENABLED));
      expect(counts.VILLAGER ?? 0).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("assignRoles", () => {
  it("gives every uid exactly one role, matching buildRoleList's composition", () => {
    const uids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const assignment = assignRoles(uids, ALL_ENABLED);
    expect(Object.keys(assignment).sort()).toEqual([...uids].sort());
    expect(countRoles(Object.values(assignment))).toEqual(
      countRoles(buildRoleList(uids.length, ALL_ENABLED)),
    );
  });

  it("rejects a uid list outside 4-16", () => {
    expect(() => assignRoles(["a", "b"], ALL_ENABLED)).toThrow(/4 đến 16/);
  });
});
