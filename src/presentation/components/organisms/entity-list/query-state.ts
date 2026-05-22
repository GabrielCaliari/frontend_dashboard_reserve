import type { EntityListRequest } from "./types";

export function serializeEntityListQuery<TFilters extends object>(
  state: EntityListRequest<TFilters>,
) {
  const params = new URLSearchParams();

  if (state.page > 1) params.set("page", String(state.page));
  params.set("limit", String(state.pageSize));
  if (state.search) params.set("q", state.search);

  if (state.sort) {
    params.set("sort", state.sort.field);
    params.set("direction", state.sort.direction);
  }

  Object.entries(state.filters).forEach(([key, value]) => {
    if (value === "" || value === false || value == null) return;
    params.set(key, Array.isArray(value) ? value.join(",") : String(value));
  });

  return params;
}

export function parseEntityListQuery<TFilters extends Record<string, unknown>>(
  params: URLSearchParams,
  defaults: TFilters,
): EntityListRequest<TFilters> {
  const filters = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    const value = params.get(key);
    if (value !== null) {
      filters[key as keyof TFilters] = value as TFilters[keyof TFilters];
    }
  });

  const page = Math.max(1, Number(params.get("page")) || 1);
  const pageSize = Math.max(1, Number(params.get("limit")) || 30);
  const sortField = params.get("sort");

  return {
    page,
    pageSize,
    search: params.get("q") ?? "",
    sort: sortField
      ? {
          field: sortField,
          direction: params.get("direction") === "asc" ? "asc" : "desc",
        }
      : undefined,
    filters,
  };
}
