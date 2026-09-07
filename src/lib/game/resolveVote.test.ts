import { describe, it, expect } from "vitest";
import { resolveVote } from "./resolveVote";

describe("resolveVote", () => {
  it("hangs whoever gets the most votes", () => {
    expect(resolveVote({ a: "v1", b: "v1", c: "v2" })).toBe("v1");
  });

  it("nobody dies on a tie", () => {
    expect(resolveVote({ a: "v1", b: "v2" })).toBeNull();
  });

  it("nobody dies when everybody abstains", () => {
    expect(resolveVote({ a: null, b: null })).toBeNull();
  });

  it("nobody dies when nobody voted at all", () => {
    expect(resolveVote({})).toBeNull();
  });

  it("abstain ballots don't count toward anyone's tally", () => {
    expect(resolveVote({ a: "v1", b: "v1", c: null })).toBe("v1");
  });

  it("a single valid vote against an otherwise-abstaining room still hangs someone", () => {
    expect(resolveVote({ a: "v1", b: null, c: null })).toBe("v1");
  });
});
