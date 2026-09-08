import { describe, it, expect } from "vitest";
import { resolveNight, tallyMajorityVote, tallyTopNVotes, type ResolveNightInput } from "./resolveNight";

const base: ResolveNightInput = {
  wolfTargets: [],
  protectTarget: null,
  witchSaveTarget: null,
  witchPoisonTarget: null,
  cursedUids: [],
  alreadyTransformedCursed: [],
};

describe("resolveNight", () => {
  it("kills the wolves' target when nobody protects or saves them", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"] });
    expect(result.deaths).toEqual(["v1"]);
  });

  it("saves the wolves' target when the bodyguard protected them", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"], protectTarget: "v1" });
    expect(result.deaths).toEqual([]);
  });

  it("saves the wolves' target when the witch cured them", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"], witchSaveTarget: "v1" });
    expect(result.deaths).toEqual([]);
  });

  it("transforms a Cursed victim into a wolf on their first bite instead of killing them", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"], cursedUids: ["v1"] });
    expect(result.deaths).toEqual([]);
    expect(result.transformed).toEqual(["v1"]);
  });

  it("kills a Cursed victim normally once already transformed (second bite doesn't re-transform)", () => {
    const result = resolveNight({
      ...base,
      wolfTargets: ["v1"],
      cursedUids: ["v1"],
      alreadyTransformedCursed: ["v1"],
    });
    expect(result.deaths).toEqual(["v1"]);
    expect(result.transformed).toEqual([]);
  });

  it("protect/save never blocks the transformation — a protected Cursed target survives untransformed", () => {
    const result = resolveNight({
      ...base,
      wolfTargets: ["v1"],
      protectTarget: "v1",
      cursedUids: ["v1"],
    });
    expect(result.deaths).toEqual([]);
    expect(result.transformed).toEqual([]);
  });

  it("poison always kills, regardless of protect or witch-save on that same target", () => {
    const result = resolveNight({
      ...base,
      witchPoisonTarget: "v2",
      protectTarget: "v2",
      witchSaveTarget: "v2",
    });
    expect(result.deaths).toEqual(["v2"]);
  });

  it("does not double-count a target hit by both the wolves and poison", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"], witchPoisonTarget: "v1" });
    expect(result.deaths).toEqual(["v1"]);
  });

  it("kills both the wolves' victim and a separately poisoned villager in the same night", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1"], witchPoisonTarget: "v2" });
    expect(result.deaths.sort()).toEqual(["v1", "v2"]);
  });

  it("nobody dies when there is no wolf target and no poison", () => {
    const result = resolveNight(base);
    expect(result.deaths).toEqual([]);
    expect(result.transformed).toEqual([]);
  });

  // Epic 3c (Wolf Cub bonus night): 2 wolf targets, each resolved fully
  // independently — no cross-target interaction.
  it("kills both wolf victims on a bonus night when neither is protected or saved", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1", "v2"] });
    expect(result.deaths.sort()).toEqual(["v1", "v2"]);
  });

  it("on a bonus night, protect/witch-save only shields the specific target it names", () => {
    const result = resolveNight({
      ...base,
      wolfTargets: ["v1", "v2"],
      protectTarget: "v1",
      witchSaveTarget: "v2",
    });
    expect(result.deaths).toEqual([]);
  });

  it("on a bonus night, one victim can be saved while the other still dies", () => {
    const result = resolveNight({ ...base, wolfTargets: ["v1", "v2"], protectTarget: "v1" });
    expect(result.deaths).toEqual(["v2"]);
  });

  it("on a bonus night, a Cursed victim among the two still transforms instead of dying", () => {
    const result = resolveNight({
      ...base,
      wolfTargets: ["v1", "v2"],
      cursedUids: ["v2"],
    });
    expect(result.deaths).toEqual(["v1"]);
    expect(result.transformed).toEqual(["v2"]);
  });
});

describe("tallyMajorityVote", () => {
  it("picks the target with the most votes", () => {
    expect(tallyMajorityVote({ w1: "v1", w2: "v1", w3: "v2" })).toBe("v1");
  });

  it("resolves to nobody when the pack ties", () => {
    expect(tallyMajorityVote({ w1: "v1", w2: "v2" })).toBeNull();
  });

  it("resolves to nobody when nobody voted", () => {
    expect(tallyMajorityVote({})).toBeNull();
  });

  it("resolves to the sole target when only one wolf voted", () => {
    expect(tallyMajorityVote({ w1: "v1" })).toBe("v1");
  });
});

describe("tallyTopNVotes", () => {
  it("n=1 behaves exactly like tallyMajorityVote", () => {
    expect(tallyTopNVotes({ w1: "v1", w2: "v1", w3: "v2" }, 1)).toEqual(["v1"]);
    expect(tallyTopNVotes({ w1: "v1", w2: "v2" }, 1)).toEqual([]);
  });

  it("n=2 returns the top-2 targets when votes are clearly separated", () => {
    const votes = { w1: "v1", w2: "v1", w3: "v1", w4: "v2", w5: "v2", w6: "v3" };
    expect(tallyTopNVotes(votes, 2)).toEqual(["v1", "v2"]);
  });

  it("n=2 stops at 1 result when the 2nd/3rd place ties", () => {
    // v1 clearly leads with 2 votes; v2 and v3 tie for 2nd with 1 vote each
    // — the tie-to-stop rule applies at whichever rank it lands on, so the
    // 2nd slot is left unfilled rather than picking one of v2/v3 arbitrarily.
    expect(tallyTopNVotes({ w1: "v1", w2: "v1", w3: "v2", w4: "v3" }, 2)).toEqual(["v1"]);
  });

  it("n=2 returns an empty array when even 1st place ties", () => {
    expect(tallyTopNVotes({ w1: "v1", w2: "v2" }, 2)).toEqual([]);
  });

  it("n=2 returns everything available when fewer than 2 distinct targets were voted", () => {
    expect(tallyTopNVotes({ w1: "v1" }, 2)).toEqual(["v1"]);
    expect(tallyTopNVotes({}, 2)).toEqual([]);
  });
});
