import { describe, it, expect } from "vitest";
import { resolveVote } from "./resolveVote";
import type { RoleKey } from "@/types/game";

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

  it("spares a Prince who wins the vote — resolves like a tie, nobody dies", () => {
    const roleOf: Record<string, RoleKey> = { v1: "PRINCE" };
    expect(resolveVote({ a: "v1", b: "v1", c: "v2" }, roleOf)).toBeNull();
  });

  it("hangs a non-Prince winner normally even when roleOf has other Prince data", () => {
    const roleOf: Record<string, RoleKey> = { v2: "PRINCE" };
    expect(resolveVote({ a: "v1", b: "v1", c: "v2" }, roleOf)).toBe("v1");
  });

  it("a Prince who merely loses the vote has no effect on who hangs", () => {
    const roleOf: Record<string, RoleKey> = { v2: "PRINCE" };
    expect(resolveVote({ a: "v1", b: "v1", c: "v1", d: "v2" }, roleOf)).toBe("v1");
  });
});
