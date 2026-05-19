import { describe, expect, it } from "vitest";
import { createAccessPolicy } from "./access-policy";

describe("createAccessPolicy", () => {
  it("denies writes until capabilities are ready", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: false,
    });

    expect(policy.can("tenants.update")).toBe(false);
  });

  it("grants wildcard access without checking master-tenant scope", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: true,
    });

    expect(policy.can("tenants.delete")).toBe(true);
    expect(policy.can("users.update")).toBe(true);
  });

  it("keeps read, update and lifecycle permissions independent", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["admins.read", "admins.update"]),
      role: "manager",
      ready: true,
    });

    expect(policy.can("admins.read")).toBe(true);
    expect(policy.can("admins.update")).toBe(true);
    expect(policy.can("admins.deactivate")).toBe(false);
  });

  it("protects the current administrator from destructive self-actions", () => {
    const policy = createAccessPolicy({
      permissions: new Set(["*"]),
      role: "super_admin",
      ready: true,
    });

    expect(policy.canActOnAdmin("super_admin", true)).toBe(false);
    expect(policy.canActOnAdmin("manager", false)).toBe(true);
  });

  it("keeps non-super-admin actions below the target hierarchy", () => {
    const owner = createAccessPolicy({
      permissions: new Set(["admins.update"]),
      role: "owner",
      ready: true,
    });
    const manager = createAccessPolicy({
      permissions: new Set(["admins.update"]),
      role: "manager",
      ready: true,
    });

    expect(owner.canActOnAdmin("super_admin", false)).toBe(false);
    expect(owner.canActOnAdmin("manager", false)).toBe(true);
    expect(manager.canActOnAdmin("owner", false)).toBe(false);
    expect(manager.canActOnAdmin("editor", false)).toBe(true);
  });
});
