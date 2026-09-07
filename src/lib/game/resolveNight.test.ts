import { describe, it, expect } from "vitest";
import { resolveNight, tallyMajorityVote, type ResolveNightInput } from "./resolveNight";

const base: ResolveNightInput = {
  wolfTarget: null,
  protectTarget: null,
  witchSaveTarget: null,
  witchPoisonTarget: null,
  cursedUids: [],
  alreadyTransformedCursed: [],
};

describe("resolveNight", () => {
  it("kills the wolves' target when nobody protects or saves them", () => {
    const result = resolveNight({ ...base, wolfTarget: "v1" });
    expect(result.deaths).toEqual(["v1"]);
  });

  it("saves the wolves' target when the bodyguard protected them", () => {
    const result = resolveNight({ ...base, wolfTarget: "v1", protectTarget: "v1" });
    expect(result.deaths).toEqual([]);
  });

  it("saves the wolves' target when the witch cured them", () => {
    const result = resolveNight({ ...base, wolfTarget: "v1", witchSaveTarget: "v1" });
    expect(result.deaths).toEqual([]);
  });

  it("transforms a Cursed victim into a wolf on their first bite instead of killing them", () => {
    const result = resolveNight({ ...base, wolfTarget: "v1", cursedUids: ["v1"] });
    expect(result.deaths).toEqual([]);
    expect(result.transformed).toEqual(["v1"]);
  });

  it("kills a Cursed victim normally once already transformed (second bite doesn't re-transform)", () => {
    const result = resolveNight({
      ...base,
      wolfTarget: "v1",
      cursedUids: ["v1"],
      alreadyTransformedCursed: ["v1"],
    });
    expect(result.deaths).toEqual(["v1"]);
    expect(result.transformed).toEqual([]);
  });

  it("protect/save never blocks the transformation — a protected Cursed target survives untransformed", () => {
    const result = resolveNight({
      ...base,
      wolfTarget: "v1",
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
    const result = resolveNight({ ...base, wolfTarget: "v1", witchPoisonTarget: "v1" });
    expect(result.deaths).toEqual(["v1"]);
  });

  it("kills both the wolves' victim and a separately poisoned villager in the same night", () => {
    const result = resolveNight({ ...base, wolfTarget: "v1", witchPoisonTarget: "v2" });
    expect(result.deaths.sort()).toEqual(["v1", "v2"]);
  });

  it("nobody dies when there is no wolf target and no poison", () => {
    const result = resolveNight(base);
    expect(result.deaths).toEqual([]);
    expect(result.transformed).toEqual([]);
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
