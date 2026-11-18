import { describe, expect, it } from "vitest";
import { checkTeamAction, generateTempPassword, inviteSchema, levelFromRoles, rolesForLevel } from "@/lib/team-rules";

const base = { actorId: "owner-1", targetId: "member-2", targetLevel: "admin" as const, activeOwnerCount: 1 };

describe("team access rules", () => {
  it("does not let anyone change their own access", () => {
    expect(checkTeamAction({ ...base, action: "block", targetId: "owner-1", targetLevel: "owner" })).not.toBeNull();
    expect(checkTeamAction({ ...base, action: "set_none", targetId: "owner-1" })).not.toBeNull();
  });

  it("keeps at least one active owner", () => {
    expect(checkTeamAction({ ...base, action: "set_admin", targetLevel: "owner", activeOwnerCount: 1 })).not.toBeNull();
    expect(checkTeamAction({ ...base, action: "block", targetLevel: "owner", activeOwnerCount: 1 })).not.toBeNull();
    expect(checkTeamAction({ ...base, action: "set_admin", targetLevel: "owner", activeOwnerCount: 2 })).toBeNull();
  });

  it("lets an owner give, remove and block another member's access", () => {
    for (const action of ["set_owner", "set_admin", "set_none", "block", "unblock", "reset_password"] as const) {
      expect(checkTeamAction({ ...base, action })).toBeNull();
    }
  });

  it("owners always also hold the admin role", () => {
    expect(rolesForLevel("owner")).toEqual(["owner", "admin"]);
    expect(rolesForLevel("admin")).toEqual(["admin"]);
    expect(rolesForLevel("none")).toEqual([]);
    expect(levelFromRoles(["admin", "owner"])).toBe("owner");
    expect(levelFromRoles([])).toBe("none");
  });

  it("invites only as owner or admin, with a valid email", () => {
    expect(inviteSchema.safeParse({ fullName: "Ana", email: "ANA@Mail.com ", level: "admin" }).data?.email).toBe("ana@mail.com");
    expect(inviteSchema.safeParse({ fullName: "Ana", email: "ana", level: "admin" }).success).toBe(false);
    expect(inviteSchema.safeParse({ fullName: "Ana", email: "ana@mail.com", level: "superuser" }).success).toBe(false);
  });

  it("generates 12-character temporary passwords without ambiguous characters", () => {
    const pw = generateTempPassword();
    expect(pw).toHaveLength(12);
    expect(pw).not.toMatch(/[0O1lI]/);
    expect(generateTempPassword()).not.toBe(pw);
  });
});
