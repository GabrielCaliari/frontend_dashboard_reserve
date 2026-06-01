"use client";

import type { EntityFilterDefinition } from "./types";

interface EntityListFiltersProps<TFilters extends object> {
  definitions: readonly EntityFilterDefinition<TFilters>[];
  values: TFilters;
  onChange(key: Extract<keyof TFilters, string>, value: unknown): void;
}

export function EntityListFilters<TFilters extends Record<string, unknown>>({
  definitions,
  values,
  onChange,
}: EntityListFiltersProps<TFilters>) {
  return (
    <div className="space-y-4">
      {definitions.map((definition) => {
        if (!definition.options || definition.kind === "custom") return null;
        const value = String(values[definition.key] ?? "");
        return (
          <label
            className="flex flex-col gap-1 text-sm font-medium text-foreground"
            key={definition.key}
          >
            {definition.label}
            <select
              aria-label={definition.label}
              className="min-h-11 rounded-lg border border-border bg-background px-2 text-sm font-normal"
              value={value}
              onChange={(event) => onChange(definition.key, event.target.value)}
            >
              <option value="">Todos</option>
              {definition.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.count === undefined ? "" : ` (${option.count})`}
                </option>
              ))}
            </select>
          </label>
        );
      })}
    </div>
  );
}
