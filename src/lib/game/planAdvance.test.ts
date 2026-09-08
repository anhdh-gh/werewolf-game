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
  wolfCubBonusNightPending: false,
  diseasedSuppressNextBite: false,
  toughGuyDeathPending: false,
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

  it("exposes deathsThisRoundRoles for the route to detect a Wolf Cub death", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, cub1: "WOLF_CUB" },
      activeRoles: [...baseInput.activeRoles, "WOLF_CUB"],
      actions: { ...NIGHT_ACTIONS_EMPTY, witchPoisonTarget: "cub1" },
    });
    expect(result.deathsThisRoundRoles).toContain("WOLF_CUB");
  });

  // Epic 3c (Wolf Cub bonus night): with wolfCubBonusNightPending true, a
  // DAWN resolution bites the top-2 voted targets instead of top-1.
  it("bites only 1 victim on a normal night even with 3 wolf votes split 3 ways minus one", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
      wolfCubBonusNightPending: false,
    });
    expect(result.deaths).toEqual(["villager1"]);
  });

  it("bites 2 victims on a Wolf Cub bonus night when votes are clearly separated", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: {
        wolf1: "WEREWOLF",
        wolf2: "WEREWOLF",
        wolf3: "WEREWOLF",
        seer1: "SEER",
        witch1: "WITCH",
        villager1: "VILLAGER",
        villager2: "VILLAGER",
      },
      actions: {
        // 2 votes for villager1, 1 for villager2 — a clean top-2 separation
        // (2 voters landing on the exact same target, unlike a simple 1-1
        // split between only 2 wolves, which would tie at rank 1 and yield
        // no bite at all — see resolveNight.test.ts's tallyTopNVotes cases).
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "villager1", wolf2: "villager1", wolf3: "villager2" },
      },
      wolfCubBonusNightPending: true,
    });
    expect(result.deaths.sort()).toEqual(["villager1", "villager2"]);
  });

  it("a Wolf Cub bonus night still only bites 1 target when the pack couldn't fill a 2nd slot", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
      wolfCubBonusNightPending: true,
    });
    expect(result.deaths).toEqual(["villager1"]);
  });

  // Epic 1b (Diseased): a successful bite on the Diseased player this night
  // arms diseasedSuppressNextBite for the *next* DAWN, but doesn't change
  // anything about tonight's own resolution.
  it("arms diseasedSuppressNextBite when the wolves successfully bite the Diseased player", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, diseased1: "DISEASED" },
      activeRoles: [...baseInput.activeRoles, "DISEASED"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "diseased1" } },
    });
    expect(result.deaths).toEqual(["diseased1"]);
    expect(result.diseasedSuppressNextBite).toBe(true);
  });

  it("does not arm diseasedSuppressNextBite when the Diseased player is protected", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, diseased1: "DISEASED" },
      activeRoles: [...baseInput.activeRoles, "DISEASED"],
      actions: {
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "diseased1" },
        protectTarget: "diseased1",
      },
    });
    expect(result.deaths).toEqual([]);
    expect(result.diseasedSuppressNextBite).toBe(false);
  });

  it("does not arm diseasedSuppressNextBite when nobody bit the Diseased player", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, diseased1: "DISEASED" },
      activeRoles: [...baseInput.activeRoles, "DISEASED"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
    });
    expect(result.diseasedSuppressNextBite).toBe(false);
  });

  it("voids tonight's wolf-bite death when diseasedSuppressNextBite is armed from last night", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
      diseasedSuppressNextBite: true,
    });
    expect(result.deaths).toEqual([]);
  });

  it("suppression this night doesn't stop a separately poisoned villager from dying", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      actions: {
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "villager1" },
        witchPoisonTarget: "seer1",
      },
      diseasedSuppressNextBite: true,
    });
    expect(result.deaths).toEqual(["seer1"]);
  });

  // Epic 1b (Tough Guy): a successful bite this night hides the death and
  // arms toughGuyDeathPending for the *next* DAWN instead.
  it("hides tonight's death and arms toughGuyDeathPending when the wolves successfully bite Tough Guy", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "tough1" } },
    });
    expect(result.deaths).toEqual([]);
    expect(result.toughGuyDeathPending).toBe(true);
  });

  it("does not arm toughGuyDeathPending when Tough Guy is protected", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: {
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "tough1" },
        protectTarget: "tough1",
      },
    });
    expect(result.deaths).toEqual([]);
    expect(result.toughGuyDeathPending).toBe(false);
  });

  it("does not arm toughGuyDeathPending on a night the wolves' bite is Diseased-suppressed", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "tough1" } },
      diseasedSuppressNextBite: true,
    });
    expect(result.deaths).toEqual([]);
    expect(result.toughGuyDeathPending).toBe(false);
  });

  it("pays off a pending Tough Guy death the following DAWN, merged with that night's other deaths", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "villager1" } },
      toughGuyDeathPending: true,
    });
    expect(result.deaths.sort()).toEqual(["tough1", "villager1"]);
    // No new bite landed on Tough Guy this night, so the debt isn't renewed.
    expect(result.toughGuyDeathPending).toBe(false);
  });

  it("applies the lover cascade to a paid-off Tough Guy death", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY", lover1: "VILLAGER" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: NIGHT_ACTIONS_EMPTY,
      lovers: ["tough1", "lover1"],
      toughGuyDeathPending: true,
    });
    expect(result.deaths.sort()).toEqual(["lover1", "tough1"]);
  });

  it("dies this night and re-arms a fresh pending death when bitten again the very next night", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: { ...NIGHT_ACTIONS_EMPTY, wolfVotes: { wolf1: "tough1" } },
      toughGuyDeathPending: true,
    });
    // Last night's debt is paid off tonight...
    expect(result.deaths).toEqual(["tough1"]);
    // ...even though tonight's fresh bite queues up a new debt for tomorrow.
    expect(result.toughGuyDeathPending).toBe(true);
  });

  it("a same-night Witch poison on Tough Guy is not deferred by a same-night wolf bite on someone else", () => {
    const result = planAdvance({
      ...baseInput,
      currentPhase: "CURSED",
      aliveRolesByUid: { ...baseInput.aliveRolesByUid, tough1: "TOUGH_GUY" },
      activeRoles: [...baseInput.activeRoles, "TOUGH_GUY"],
      actions: {
        ...NIGHT_ACTIONS_EMPTY,
        wolfVotes: { wolf1: "villager1" },
        witchPoisonTarget: "tough1",
      },
    });
    expect(result.deaths.sort()).toEqual(["tough1", "villager1"]);
    expect(result.toughGuyDeathPending).toBe(false);
  });
});
