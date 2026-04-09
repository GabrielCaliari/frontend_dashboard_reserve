import { AdminRole } from "@/src/common/@types/@access-management";

export type RoleColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "default";

/**
 * Single source of truth for role → color mapping.
 * Used by AdminTable, AdminDetailPage, RoleBadge, and all future components.
 */
export const ROLE_COLORS: Record<AdminRole, RoleColor> = {
  [AdminRole.super_admin]: "danger",
  [AdminRole.owner]: "warning",
  [AdminRole.manager]: "primary",
  [AdminRole.editor]: "secondary",
  [AdminRole.viewer]: "default",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  [AdminRole.super_admin]: "Super Admin",
  [AdminRole.owner]: "Owner",
  [AdminRole.manager]: "Manager",
  [AdminRole.editor]: "Editor",
  [AdminRole.viewer]: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  [AdminRole.super_admin]: "Full system access across all tenants",
  [AdminRole.owner]: "Manage tenants, admins and all resources",
  [AdminRole.manager]: "Manage campaigns, leads and content",
  [AdminRole.editor]: "Create and edit content only",
  [AdminRole.viewer]: "Read-only access to all resources",
};

/** Returns the HeroUI color variant for a given role chip. */
export function getRoleColor(role: AdminRole): RoleColor {
  return ROLE_COLORS[role] ?? "default";
}

/** Returns the human-readable label for a given role. */
export function formatRoleLabel(role: AdminRole): string {
  return ROLE_LABELS[role] ?? role;
}

/** Returns the role description string. */
export function getRoleDescription(role: AdminRole): string {
  return ROLE_DESCRIPTIONS[role] ?? "";
}
