import { describe, it, expect } from "vitest";
import { checkWinner } from "./checkWinner";

describe("checkWinner", () => {
  it("Tanner dying ends the game immediately, even if the wolves also just got wiped out", () => {
    const result = checkWinner({
      deathsThisRoundRoles: ["TANNER", "WEREWOLF"],
      aliveRoles: ["VILLAGER", "SEER"],
    });
    expect(result).toBe("TANNER");
  });

  it("village wins once no wolf-faction role is left alive", () => {
    const result = checkWinner({
      deathsThisRoundRoles: ["WEREWOLF"],
      aliveRoles: ["VILLAGER", "SEER", "WITCH"],
    });
    expect(result).toBe("VILLAGE");
  });

  it("the Traitor alone (no Werewolf left) still counts as the wolf faction surviving", () => {
    const result = checkWinner({
      deathsThisRoundRoles: ["WEREWOLF"],
      aliveRoles: ["TRAITOR", "VILLAGER", "SEER"],
    });
    expect(result).toBeNull();
  });

  it("wolves win once they outnumber or match everyone else alive", () => {
    const result = checkWinner({
      deathsThisRoundRoles: ["VILLAGER"],
      aliveRoles: ["WEREWOLF", "WEREWOLF", "VILLAGER"],
    });
    expect(result).toBe("WOLF");
  });

  it("the Traitor counts toward the wolf side of the headcount, not the village side", () => {
    const result = checkWinner({
      deathsThisRoundRoles: [],
      aliveRoles: ["WEREWOLF", "TRAITOR", "VILLAGER", "SEER"],
    });
    expect(result).toBe("WOLF");
  });

  it("the game continues when neither side has won yet", () => {
    const result = checkWinner({
      deathsThisRoundRoles: ["VILLAGER"],
      aliveRoles: ["WEREWOLF", "VILLAGER", "SEER", "WITCH"],
    });
    expect(result).toBeNull();
  });
});
