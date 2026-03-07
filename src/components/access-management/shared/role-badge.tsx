"use client";

import { Chip, Tooltip } from "@nextui-org/react";
import { AdminRole } from "@/src/common/@types/@access-management";
import { getRoleColor, formatRoleLabel, getRoleDescription } from "@/src/common/utils/role-utils";

interface RoleBadgeProps {
  role: AdminRole;
  showTooltip?: boolean;
  size?: "sm" | "md" | "lg";
}

export function RoleBadge({ role, showTooltip = false, size = "sm" }: RoleBadgeProps) {
  const chip = (
    <Chip color={getRoleColor(role)} variant="flat" size={size}>
      {formatRoleLabel(role)}
    </Chip>
  );

  if (showTooltip) {
    return (
      <Tooltip content={getRoleDescription(role)} placement="top">
        <span>{chip}</span>
      </Tooltip>
    );
  }

  return chip;
}
