"use client";

import type { KeyboardEvent, ReactNode } from "react";
import clsx from "clsx";

type EntityStatusTone =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "primary"
  | "secondary";

interface EntityListItemProps {
  title: ReactNode;
  description?: ReactNode;
  identity?: ReactNode;
  badges?: ReactNode;
  metadata?: ReactNode;
  trailing?: ReactNode;
  status?: { label: string; tone: EntityStatusTone };
  actions?: ReactNode;
  selectable?: {
    label: string;
    selected: boolean;
    onSelectionChange(selected: boolean): void;
  };
  onActivate?: () => void;
}

const statusClasses: Record<EntityStatusTone, string> = {
  default: "bg-default-400",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  primary: "bg-primary",
  secondary: "bg-secondary",
};

export function EntityListItem({
  title,
  description,
  identity,
  badges,
  metadata,
  trailing,
  status,
  actions,
  selectable,
  onActivate,
}: EntityListItemProps) {
  const titleText = typeof title === "string" ? title : "Abrir item";
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate?.();
  };

  return (
    <li className="relative flex min-w-0 gap-3 border-b border-divider px-4 py-3 last:border-b-0">
      {status ? (
        <span
          aria-label={`Status: ${status.label}`}
          className={clsx("absolute inset-y-0 left-0 w-1", statusClasses[status.tone])}
          role="img"
        />
      ) : null}
      {selectable ? (
        <input
          aria-label={selectable.label}
          checked={selectable.selected}
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
          type="checkbox"
          onChange={(event) => selectable.onSelectionChange(event.target.checked)}
          onClick={(event) => event.stopPropagation()}
        />
      ) : null}
      <div
        aria-label={titleText}
        className={clsx(
          "min-w-0 flex-1",
          onActivate &&
            "cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary",
        )}
        role={onActivate ? "button" : undefined}
        tabIndex={onActivate ? 0 : undefined}
        onClick={onActivate}
        onKeyDown={onKeyDown}
      >
        <div className="flex min-w-0 items-start gap-3">
          {identity ? <div className="shrink-0">{identity}</div> : null}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{title}</p>
              {badges ? <div className="flex flex-wrap gap-1">{badges}</div> : null}
              {status ? (
                <span className="text-xs font-medium text-muted-foreground">
                  {status.label}
                </span>
              ) : null}
            </div>
            {description ? (
              <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>
            ) : null}
            {metadata ? (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {metadata}
              </div>
            ) : null}
          </div>
          {trailing ? (
            <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">
              {trailing}
            </div>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div
          className="flex shrink-0 items-start gap-1"
          onClick={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </li>
  );
}
