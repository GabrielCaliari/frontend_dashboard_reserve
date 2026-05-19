import type { AdminRoleValue } from "./admin-role";

export type AccessPermission =
  | "tenants.create"
  | "tenants.read"
  | "tenants.update"
  | "tenants.admin.read"
  | "tenants.admin.assign"
  | "tenants.admin.remove"
  | "tenants.admin.role.update"
  | "tenants.activate"
  | "tenants.deactivate"
  | "tenants.delete"
  | "tenants.domains.manage-regex"
  | "settings.modules.manage"
  | "admins.create"
  | "admins.read"
  | "admins.update"
  | "admins.role.update"
  | "admins.activate"
  | "admins.deactivate"
  | "admins.delete"
  | "users.read"
  | "users.update"
  | "users.deactivate"
  | "users.delete";

export interface AccessPolicy {
  readonly role: AdminRoleValue;
  readonly ready: boolean;
  can(permission: AccessPermission): boolean;
  canActOnAdmin(targetRole: AdminRoleValue, isSelf: boolean): boolean;
}

export function createAccessPolicy({
  permissions = new Set<string>(),
  role = "viewer",
  ready,
}: {
  permissions?: ReadonlySet<string>;
  role?: AdminRoleValue;
  ready: boolean;
}): AccessPolicy {
  return {
    role,
    ready,
    can: (permission) =>
      ready && (permissions.has("*") || permissions.has(permission)),
    canActOnAdmin: (targetRole, isSelf) => {
      if (!ready || isSelf) return false;
      if (role === "super_admin") return true;
      if (role === "owner") return targetRole !== "super_admin";
      if (role === "manager")
        return targetRole !== "super_admin" && targetRole !== "owner";

      return false;
    },
  };
}
