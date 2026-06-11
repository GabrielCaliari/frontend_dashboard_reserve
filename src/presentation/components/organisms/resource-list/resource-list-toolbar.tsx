"use client";

import type { ReactNode } from "react";
import { Input } from "@heroui/react";
import { Search } from "lucide-react";

export interface ResourceListFilter {
  key: string;
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface ResourceListToolbarProps {
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: readonly ResourceListFilter[];
  actions?: ReactNode;
  count?: ReactNode;
  countLabel?: string;
}

export function ResourceListToolbar({
  searchLabel,
  searchValue,
  onSearchChange,
  filters = [],
  actions,
  count,
  countLabel = "Total de recursos",
}: ResourceListToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      {count !== undefined && (
        <div
          aria-label={countLabel}
          aria-live="polite"
          className="text-sm text-muted-foreground"
          role="status"
        >
          {count}
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            aria-label={searchLabel}
            className="w-full sm:max-w-sm"
            placeholder={searchLabel}
            startContent={<Search aria-hidden="true" className="h-4 w-4 text-muted-foreground" />}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          {filters.map((filter) => (
            <label
              className="flex min-w-40 flex-col gap-1 text-xs text-muted-foreground"
              key={filter.key}
            >
              {filter.label}
              <select
                aria-label={filter.label}
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={filter.value}
                onChange={(event) => filter.onChange(event.target.value)}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
