import { describe, it, expect } from "vitest";
import {
  buildRoleList,
  deckIssue,
  assertValidDeck,
  assignRoles,
  buildMasonLinks,
  buildBeholderTargets,
} from "./roles";
import { ALL_ROLE_KEYS, type RoleKey } from "@/types/game";

function zeroDeck(): Record<RoleKey, number> {
  return Object.fromEntries(ALL_ROLE_KEYS.map((key) => [key, 0])) as Record<RoleKey, number>;
}

function deck(overrides: Partial<Record<RoleKey, number>>): Record<RoleKey, number> {
  return { ...zeroDeck(), ...overrides };
}

function countRoles(roles: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const role of roles) counts[role] = (counts[role] ?? 0) + 1;
  return counts;
}

describe("buildRoleList", () => {
  it("deals exactly the counts given, ignoring input order", () => {
    const roles = buildRoleList(deck({ WEREWOLF: 2, SEER: 1, WITCH: 1, VILLAGER: 4 }));
    expect(roles).toHaveLength(8);
    expect(countRoles(roles)).toEqual({ WEREWOLF: 2, SEER: 1, WITCH: 1, VILLAGER: 4 });
  });

  it("produces an empty list for an all-zero deck", () => {
    expect(buildRoleList(zeroDeck())).toEqual([]);
  });
});

describe("deckIssue / assertValidDeck", () => {
  it("rejects a deck totaling fewer than 4", () => {
    const bad = deck({ WEREWOLF: 1, VILLAGER: 2 });
    expect(deckIssue(bad)).toMatch(/ít nhất 4/);
    expect(() => assertValidDeck(bad)).toThrow(/ít nhất 4/);
  });

  it("rejects a deck totaling more than 16", () => {
    const bad = deck({ WEREWOLF: 10, VILLAGER: 10 });
    expect(deckIssue(bad)).toMatch(/Tối đa 16/);
    expect(() => assertValidDeck(bad)).toThrow(/Tối đa 16/);
  });

  it("rejects a deck with zero Wolf-faction roles even if the total is valid", () => {
    const bad = deck({ SEER: 1, WITCH: 1, VILLAGER: 6 });
    expect(deckIssue(bad)).toMatch(/phe Sói/);
    expect(() => assertValidDeck(bad)).toThrow(/phe Sói/);
  });

  it("accepts any wolf-faction role, not just Werewolf, toward the ≥1 wolf guardrail", () => {
    const withTraitor = deck({ TRAITOR: 1, VILLAGER: 4 });
    expect(deckIssue(withTraitor)).toBeNull();
    expect(() => assertValidDeck(withTraitor)).not.toThrow();
  });

  it("accepts a valid deck with no other implicit requirements — no Seer/Witch/Villager needed", () => {
    const noSeerNoWitch = deck({ WEREWOLF: 4 });
    expect(deckIssue(noSeerNoWitch)).toBeNull();
    expect(() => assertValidDeck(noSeerNoWitch)).not.toThrow();
  });
});

describe("assignRoles", () => {
  it("gives every uid exactly one role, matching the deck's composition, keeping who-gets-what random", () => {
    const uids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const roleCounts = deck({ WEREWOLF: 2, SEER: 1, WITCH: 1, BODYGUARD: 1, TRAITOR: 1, HUNTER: 1, VILLAGER: 1 });
    const assignment = assignRoles(uids, roleCounts);
    expect(Object.keys(assignment).sort()).toEqual([...uids].sort());
    expect(countRoles(Object.values(assignment))).toEqual(countRoles(buildRoleList(roleCounts)));
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

describe("buildBeholderTargets", () => {
  it("points a single Beholder at the game's one Seer", () => {
    const targets = buildBeholderTargets({ a: "BEHOLDER", b: "SEER", c: "VILLAGER" });
    expect(targets).toEqual({ a: "b" });
  });

  it("points every Beholder at the same Seer when more than one is dealt", () => {
    const targets = buildBeholderTargets({
      a: "BEHOLDER",
      b: "BEHOLDER",
      c: "SEER",
      d: "VILLAGER",
    });
    expect(targets).toEqual({ a: "c", b: "c" });
  });

  it("returns nothing for a game with no Beholder at all", () => {
    const targets = buildBeholderTargets({ a: "SEER", b: "VILLAGER" });
    expect(targets).toEqual({});
  });

  it("returns nothing if there's a Beholder but somehow no Seer (defensive, shouldn't happen)", () => {
    const targets = buildBeholderTargets({ a: "BEHOLDER", b: "VILLAGER" });
    expect(targets).toEqual({});
  });
});
