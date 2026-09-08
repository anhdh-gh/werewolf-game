import { describe, it, expect } from "vitest";
import { requiredActorsForPhase } from "./requiredActors";
import type { RoleKey } from "@/types/game";

const ROLES: Record<string, RoleKey> = {
  wolf1: "WEREWOLF",
  wolf2: "WEREWOLF",
  traitor1: "TRAITOR",
  seer1: "SEER",
  witch1: "WITCH",
  bodyguard1: "BODYGUARD",
  muter1: "MUTER",
  cupid1: "CUPID",
  hunter1: "HUNTER",
  cursed1: "CURSED",
  sorcerer1: "SORCERER",
  wolfman1: "WOLF_MAN",
  wolfcub1: "WOLF_CUB",
  villager1: "VILLAGER",
};

describe("requiredActorsForPhase", () => {
  it("the Werewolves, Wolf Man, and Wolf Cub act during WOLVES — the Traitor does not", () => {
    const actors = requiredActorsForPhase("WOLVES", ROLES);
    expect(actors.sort()).toEqual(["wolf1", "wolf2", "wolfcub1", "wolfman1"]);
  });

  it("returns nobody for WOLVES when no Werewolf, Wolf Man, or Wolf Cub is alive", () => {
    const {
      wolf1: _w1,
      wolf2: _w2,
      wolfman1: _wm1,
      wolfcub1: _wc1,
      ...withoutWolves
    } = ROLES;
    expect(requiredActorsForPhase("WOLVES", withoutWolves)).toEqual([]);
  });

  it("only the Seer acts during SEER", () => {
    expect(requiredActorsForPhase("SEER", ROLES)).toEqual(["seer1"]);
  });

  it("only the Sorcerer acts during SORCERER", () => {
    expect(requiredActorsForPhase("SORCERER", ROLES)).toEqual(["sorcerer1"]);
  });

  it("only the Witch acts during both witch phases", () => {
    expect(requiredActorsForPhase("WITCH_SAVE", ROLES)).toEqual(["witch1"]);
    expect(requiredActorsForPhase("WITCH_KILL", ROLES)).toEqual(["witch1"]);
  });

  it("only Cupid acts during PAIR_LOVERS", () => {
    expect(requiredActorsForPhase("PAIR_LOVERS", ROLES)).toEqual(["cupid1"]);
  });

  it("everyone alive votes during VOTE", () => {
    const actors = requiredActorsForPhase("VOTE", ROLES);
    expect(actors.sort()).toEqual(Object.keys(ROLES).sort());
  });

  it("nobody is required during announcement/wait phases", () => {
    expect(requiredActorsForPhase("NIGHT_FALLS", ROLES)).toEqual([]);
    expect(requiredActorsForPhase("DAWN", ROLES)).toEqual([]);
    expect(requiredActorsForPhase("DISCUSSION", ROLES)).toEqual([]);
    expect(requiredActorsForPhase("VOTE_RESULT", ROLES)).toEqual([]);
    expect(requiredActorsForPhase("REVEAL_ROLE", ROLES)).toEqual([]);
    expect(requiredActorsForPhase("ENDED", ROLES)).toEqual([]);
  });

  it("nobody is required during CURSED — the Cursed player has no active decision to make", () => {
    expect(requiredActorsForPhase("CURSED", ROLES)).toEqual([]);
  });

  it("returns nobody for a role phase whose role isn't alive", () => {
    const { seer1: _seer1, ...withoutSeer } = ROLES;
    expect(requiredActorsForPhase("SEER", withoutSeer)).toEqual([]);
  });

  it("returns nobody for SORCERER when the Sorcerer isn't alive or isn't in the game", () => {
    const { sorcerer1: _sorcerer1, ...withoutSorcerer } = ROLES;
    expect(requiredActorsForPhase("SORCERER", withoutSorcerer)).toEqual([]);
  });
});
