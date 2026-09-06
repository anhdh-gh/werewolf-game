import { describe, it, expect } from "vitest";
import {
  roomPath,
  roomMembersPath,
  roomMemberPath,
  roomSettingsPath,
  roomStatusPath,
  presencePath,
} from "./paths";

describe("rtdb paths", () => {
  it("builds room paths", () => {
    expect(roomPath("ABC123")).toBe("rooms/ABC123");
    expect(roomMembersPath("ABC123")).toBe("rooms/ABC123/members");
    expect(roomMemberPath("ABC123", "uid-1")).toBe("rooms/ABC123/members/uid-1");
    expect(roomSettingsPath("ABC123")).toBe("rooms/ABC123/settings");
    expect(roomStatusPath("ABC123")).toBe("rooms/ABC123/status");
  });

  it("builds presence paths", () => {
    expect(presencePath("uid-1")).toBe("presence/uid-1");
  });
});
