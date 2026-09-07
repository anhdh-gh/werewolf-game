import { describe, it, expect } from "vitest";
import { applyLoverDeaths, applyHunterRevenge, applyDeathExtras } from "./resolveDeathExtras";

describe("applyLoverDeaths", () => {
  it("kills the surviving lover of hearbreak when their partner is in the death list", () => {
    expect(applyLoverDeaths(["v1"], ["v1", "v2"])).toEqual(["v1", "v2"]);
  });

  it("does nothing when there is no lover pairing", () => {
    expect(applyLoverDeaths(["v1"], null)).toEqual(["v1"]);
  });

  it("does not duplicate a lover who is already in the death list", () => {
    expect(applyLoverDeaths(["v1", "v2"], ["v1", "v2"])).toEqual(["v1", "v2"]);
  });

  it("does nothing when neither lover died", () => {
    expect(applyLoverDeaths(["v3"], ["v1", "v2"])).toEqual(["v3"]);
  });
});

describe("applyHunterRevenge", () => {
  it("kills the Hunter's chosen target when the Hunter is among the dead", () => {
    expect(applyHunterRevenge(["hunter1"], { hunter1: "v9" })).toEqual(["hunter1", "v9"]);
  });

  it("does not apply a shot from a Hunter who didn't die", () => {
    expect(applyHunterRevenge(["v1"], { hunter1: "v9" })).toEqual(["v1"]);
  });

  it("a Hunter choosing to shoot nobody changes nothing", () => {
    expect(applyHunterRevenge(["hunter1"], {})).toEqual(["hunter1"]);
  });
});

describe("applyDeathExtras", () => {
  it("chains a Hunter's revenge shot into a second lover heartbreak death", () => {
    // The wolves kill the Hunter. The Hunter shoots v2 on the way out. v2's
    // lover, v3, then dies of heartbreak too — spec §4.4 step 8's explicit
    // "kéo theo người yêu" case.
    const result = applyDeathExtras(["hunter1"], ["v2", "v3"], { hunter1: "v2" });
    expect(result.sort()).toEqual(["hunter1", "v2", "v3"]);
  });

  it("applies lover heartbreak from the original death list even with no Hunter involved", () => {
    const result = applyDeathExtras(["v1"], ["v1", "v2"], {});
    expect(result.sort()).toEqual(["v1", "v2"]);
  });
});
