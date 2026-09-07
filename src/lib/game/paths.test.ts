import { describe, it, expect } from "vitest";
import {
  gamePath,
  gamePhasePath,
  gamePlayerPath,
  gameActionsPath,
  gameActionPath,
  gameResultPath,
  privatePlayerPath,
} from "./paths";

describe("game rtdb paths", () => {
  it("builds game paths", () => {
    expect(gamePath("g1")).toBe("games/g1");
    expect(gamePhasePath("g1")).toBe("games/g1/phase");
    expect(gamePlayerPath("g1", "uid-1")).toBe("games/g1/players/uid-1");
    expect(gameResultPath("g1")).toBe("games/g1/result");
  });

  it("builds action paths under their own top-level tree, not nested in games/", () => {
    expect(gameActionsPath("g1", "WOLVES")).toBe("actions/g1/WOLVES");
    expect(gameActionPath("g1", "WOLVES", "uid-1")).toBe("actions/g1/WOLVES/uid-1");
  });

  it("builds the private-state path", () => {
    expect(privatePlayerPath("g1", "uid-1")).toBe("private/g1/uid-1");
  });
});
