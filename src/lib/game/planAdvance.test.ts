import { describe, it, expect } from "vitest";
import { planAdvance, type PlanAdvanceInput } from "./planAdvance";

const NIGHT_ACTIONS_EMPTY: PlanAdvanceInput["actions"] = {
  protectTarget: null,
  wolfVotes: {},
  witchSaveTarget: null,
  witchPoisonTarget: null,
  voteBallots: {},
  hunterShots: {},
};

const baseInput: PlanAdvanceInput = {
  currentPhase: "CURSED",
  activeRoles: ["WEREWOLF", "SEER", "WITCH", "VILLAGER"],
  aliveRolesByUid: {
    wolf1: "WEREWOLF",
    seer1: "SEER",
    witch1: "WITCH",
    villager1: "VILLAGER",
  },
  actions: NIGHT_ACTIONS_EMPTY,
  cursedUids: [],
  alreadyTransformedCursed: [],
  lovers: null,
};

describe("planAdvance", () => {
  it("just moves to the next phase with no resolution when not entering DAWN or VOTE_RESULT", () => {
    const result = planAdvance({ ...baseInput, currentPhase: "NIGHT_FALLS" });
    expect(result.nextPhase).toBe("SEER");
    expect(result.deaths).toEqual([]);
    expect(result.winner).toBeNull();
  });

  it("resolves the night and moves to DAWN when leaving the last active night phase", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
    });
    expect(result.nextPhase).toBe("DAWN");
    expect(result.deaths).toEqual(["villager1"]);
  });

  it("declares Village the winner once the night kill wipes out the last wolf", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { wolf1: "WEREWOLF", villager1: "VILLAGER" },
      activeRoles: ["WEREWOLF", "VILLAGER"],
      actions: { ...NIGHT_ACTIONS_EMPTY, witchPoisonTarget: "wolf1" },
    });
    expect(result.nextPhase).toBe("ENDED");
    expect(result.winner).toBe("VILLAGE");
    expect(result.deaths).toEqual(["wolf1"]);
  });

  it("resolves the day vote and moves to VOTE_RESULT when leaving VOTE", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "VOTE",
      actions: { ...NIGHT_ACTIONS_EMPTY, voteBallots: { seer1: "villager1", witch1: "villager1" } },
    });
    expect(result.nextPhase).toBe("VOTE_RESULT");
    expect(result.deaths).toEqual(["villager1"]);
  });

  it("ends the game immediately when the vote hangs the Tanner", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "VOTE",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tanner1: "TANNER" },
      actions: { ...NIGHT_ACTIONS_EMPTY, voteBallots: { seer1: "tanner1", witch1: "tanner1" } },
    });
    expect(result.nextPhase).toBe("ENDED");
    expect(result.winner).toBe("TANNER");
  });

  it("spares a Prince who wins the vote — nobody dies and the round looks like a tie", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "VOTE",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, prince1: "PRINCE" },
      actions: { ...NIGHT_ACTIONS_EMPTY, voteBallots: { seer1: "prince1", witch1: "prince1" } },
    });
    expect(result.nextPhase).toBe("VOTE_RESULT");
    expect(result.deaths).toEqual([]);
  });

  it("chains a Hunter's revenge shot and lover heartbreak through the night resolution", () => {
    const result = planAdvance({
      ...baseInput,
      aliveRolesByUid: {
        wolf1: "WEREWOLF",
        hunter1: "HUNTER",
        lover1: "VILLAGER",
        villager1: "VILLAGER",
      },
      activeRoles: ["WEREWOLF", "HUNTER", "VILLAGER"],
      actions: {
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "hunter1" },
        hunterShots: { hunter1: "lover1" },
      },
      lovers: ["lover1", "villager1"],
    });
    expect(result.deaths.sort()).toEqual(["hunter1", "lover1", "villager1"]);
  });
});
