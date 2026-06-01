"use client";

import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface EntityListToolbarProps {
  searchValue: string;
  onSearchChange(value: string): void;
  actions?: ReactNode;
  showSearch?: boolean;
}

export function EntityListToolbar({
  searchValue,
  onSearchChange,
  actions,
  showSearch = true,
}: EntityListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showSearch ? (
        <label className="relative block min-w-0 flex-1 sm:max-w-md">
          <span className="sr-only">Buscar</span>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            aria-label="Buscar"
            className="min-h-11 w-full rounded-xl border border-border bg-content1 pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      ) : (
        <span className="flex-1" />
      )}
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
