export const ADMIN_ROLE_VALUES = [
  "super_admin",
  "owner",
  "manager",
  "editor",
  "viewer",
] as const;

export type AdminRoleValue = (typeof ADMIN_ROLE_VALUES)[number];

export function normalizeAdminRole(value: unknown): AdminRoleValue {
  return typeof value === "string" &&
    (ADMIN_ROLE_VALUES as readonly string[]).includes(value)
    ? (value as AdminRoleValue)
    : "viewer";
}
