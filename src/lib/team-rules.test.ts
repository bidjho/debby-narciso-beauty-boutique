import { describe, expect, it } from "vitest";
import {
  buildAccessMessage,
  checkTeamAction,
  levelFromRoles,
  rolesForLevel,
} from "./team-rules";

describe("team access rules", () => {
  it("maps owner and administrator roles to access levels", () => {
    expect(levelFromRoles(["admin", "owner"])).toBe("owner");
    expect(levelFromRoles(["admin"])).toBe("admin");
    expect(levelFromRoles([])).toBe("none");
  });

  it("assigns the admin role to owners as well", () => {
    expect(rolesForLevel("owner")).toEqual(["owner", "admin"]);
    expect(rolesForLevel("admin")).toEqual(["admin"]);
    expect(rolesForLevel("none")).toEqual([]);
  });

  it("prevents members from changing their own access", () => {
    expect(checkTeamAction({
      action: "set_none",
      actorId: "same-user",
      targetId: "same-user",
      targetLevel: "owner",
      activeOwnerCount: 2,
    })).toContain("próprio acesso");
  });

  it("keeps at least one active store owner", () => {
    expect(checkTeamAction({
      action: "block",
      actorId: "owner-1",
      targetId: "owner-2",
      targetLevel: "owner",
      activeOwnerCount: 1,
    })).toContain("pelo menos um dono");
    expect(checkTeamAction({
      action: "set_admin",
      actorId: "owner-1",
      targetId: "owner-2",
      targetLevel: "owner",
      activeOwnerCount: 2,
    })).toBeNull();
  });

  it("builds a complete welcome message without exposing credentials elsewhere", () => {
    const message = buildAccessMessage({
      name: "Ana",
      email: "ana@example.com",
      password: "temporary-pass",
      loginUrl: "https://example.com/auth",
    });

    expect(message).toContain("Olá Ana!");
    expect(message).toContain("ana@example.com");
    expect(message).toContain("temporary-pass");
    expect(message).toContain("https://example.com/auth");
  });
});
