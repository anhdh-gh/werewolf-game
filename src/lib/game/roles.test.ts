import { describe, it, expect } from "vitest";
import { wolfCount, buildRoleList, assignRoles, buildMasonLinks } from "./roles";
import type { OptionalRoleKey } from "@/types/room";

const ALL_ENABLED: Record<OptionalRoleKey, boolean> = {
  BODYGUARD: true,
  TRAITOR: true,
  HUNTER: true,
  CUPID: true,
  MUTER: true,
  CURSED: true,
  LYCAN: true,
  MASON: true,
  PRINCE: true,
  PACIFIST: true,
  VILLAGE_IDIOT: true,
  SORCERER: true,
  WOLF_MAN: true,
  WOLF_CUB: true,
  TANNER: true,
};

const ALL_DISABLED: Record<OptionalRoleKey, boolean> = {
  BODYGUARD: false,
  TRAITOR: false,
  HUNTER: false,
  CUPID: false,
  MUTER: false,
  CURSED: false,
  LYCAN: false,
  MASON: false,
  PRINCE: false,
  PACIFIST: false,
  VILLAGE_IDIOT: false,
  SORCERER: false,
  WOLF_MAN: false,
  WOLF_CUB: false,
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

  it("at 8 players with everything enabled, fills Bodyguard/Traitor/Hunter before running out of slots", () => {
    const roles = buildRoleList(8, ALL_ENABLED);
    expect(roles).toHaveLength(8);
    expect(countRoles(roles)).toEqual({
      WEREWOLF: 2,
      SEER: 1,
      WITCH: 1,
      BODYGUARD: 1,
      TRAITOR: 1,
      HUNTER: 1,
      VILLAGER: 1,
    });
  });

  it("at 16 players with everything enabled, fills every optional role slot it has room for", () => {
    // OPTIONAL_ROLE_KEYS has grown to 15 entries (Mason, Prince, Pacifist,
    // Village Idiot, Sorcerer, Wolf Man, Wolf Cub added on top of the
    // original 8) while n=16 only ever had 9 optional slots to give out
    // (16 - 6 mandatory - 1 reserved villager) — so the last six entries in
    // fill order (Pacifist, Village Idiot, Sorcerer, Wolf Man, Wolf Cub, then
    // Tanner) miss their slot. That's by design (spec §4.2: the sole Riêng
    // role Tanner is always lowest fill priority; Pacifist, Village Idiot,
    // Sorcerer, Wolf Man and Wolf Cub just happen to be the ones immediately
    // ahead of it once every earlier role is enabled) — see the dedicated
    // capacity test below.
    const roles = buildRoleList(16, ALL_ENABLED);
    expect(roles).toHaveLength(16);
    expect(countRoles(roles)).toEqual({
      WEREWOLF: 4,
      SEER: 1,
      WITCH: 1,
      BODYGUARD: 1,
      TRAITOR: 1,
      HUNTER: 1,
      CUPID: 1,
      MUTER: 1,
      CURSED: 1,
      LYCAN: 1,
      MASON: 1,
      PRINCE: 1,
      VILLAGER: 1,
    });
  });

  it("drops Pacifist, Village Idiot, Sorcerer, Wolf Man, Wolf Cub, and Tanner first, not any earlier Wolf/Village-faction role, when demand exceeds capacity", () => {
    const counts = countRoles(buildRoleList(16, ALL_ENABLED));
    expect(counts.PACIFIST).toBeUndefined();
    expect(counts.VILLAGE_IDIOT).toBeUndefined();
    expect(counts.SORCERER).toBeUndefined();
    expect(counts.WOLF_MAN).toBeUndefined();
    expect(counts.WOLF_CUB).toBeUndefined();
    expect(counts.TANNER).toBeUndefined();
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
      TRAITOR: 1,
      HUNTER: 1,
      CUPID: 1,
      VILLAGER: 1,
    });
  });

  it("always includes at least one villager even when every optional role is enabled and would otherwise fit", () => {
    for (let n = 4; n <= 16; n++) {
      const counts = countRoles(buildRoleList(n, ALL_ENABLED));
      expect(counts.VILLAGER ?? 0).toBeGreaterThanOrEqual(1);
    }
  });

  it("fills every Wolf- and Village-faction optional role before ever dealing the sole Riêng role (Tanner)", () => {
    // 11 players, everything enabled: 5 optional slots are available, and
    // Tanner sits last in the fill order (spec §4.2's explicit priority) —
    // so with only 5 slots to hand out, Tanner must not appear yet.
    const counts = countRoles(buildRoleList(11, ALL_ENABLED));
    expect(counts.TANNER).toBeUndefined();
    expect(counts.CURSED).toBeUndefined();
    expect(counts.LYCAN).toBeUndefined();
    expect(counts.MASON).toBeUndefined();
    expect(counts.PRINCE).toBeUndefined();
    expect(counts.PACIFIST).toBeUndefined();
    expect(counts.SORCERER).toBeUndefined();
    expect(counts.WOLF_MAN).toBeUndefined();
    expect(counts.WOLF_CUB).toBeUndefined();
    expect(counts).toEqual({
      WEREWOLF: 3,
      SEER: 1,
      WITCH: 1,
      BODYGUARD: 1,
      TRAITOR: 1,
      HUNTER: 1,
      CUPID: 1,
      MUTER: 1,
      VILLAGER: 1,
    });
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

describe("buildMasonLinks", () => {
  it("pairs two Masons with each other symmetrically, excluding themselves", () => {
    const links = buildMasonLinks({ a: "MASON", b: "MASON", c: "SEER" });
    expect(links).toEqual({ a: ["b"], b: ["a"] });
  });

  it("gives every Mason the full list of every other Mason when 3+ are dealt", () => {
    const links = buildMasonLinks({ a: "MASON", b: "MASON", c: "MASON", d: "VILLAGER" });
    expect(links.a.sort()).toEqual(["b", "c"]);
    expect(links.b.sort()).toEqual(["a", "c"]);
    expect(links.c.sort()).toEqual(["a", "b"]);
  });

  it("gives a solo Mason an empty array — nobody else to know about", () => {
    const links = buildMasonLinks({ a: "MASON", b: "SEER", c: "VILLAGER" });
    expect(links).toEqual({ a: [] });
  });

  it("returns nothing for a game with no Mason at all", () => {
    const links = buildMasonLinks({ a: "SEER", b: "VILLAGER" });
    expect(links).toEqual({});
  });
});
