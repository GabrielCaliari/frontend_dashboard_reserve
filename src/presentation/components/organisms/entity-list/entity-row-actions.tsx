"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { MoreVertical, type LucideIcon } from "lucide-react";

export interface EntityRowAction {
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
  onSelect(): void;
}

interface EntityRowActionsProps {
  ariaLabel: string;
  actions: readonly EntityRowAction[];
}

const TONE_CLASS: Record<NonNullable<EntityRowAction["tone"]>, string> = {
  default: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
};

export function EntityRowActions({ ariaLabel, actions }: EntityRowActionsProps) {
  if (actions.length === 0) return null;

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <button
          aria-label={ariaLabel}
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-default-100 hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownTrigger>
      <DropdownMenu aria-label={ariaLabel} variant="flat">
        {actions.map(({ key, label, icon: Icon, tone = "default", onSelect }) => (
          <DropdownItem
            key={key}
            className={TONE_CLASS[tone]}
            color={tone === "danger" ? "danger" : "default"}
            startContent={<Icon className="h-4 w-4" />}
            onPress={onSelect}
          >
            {label}
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
