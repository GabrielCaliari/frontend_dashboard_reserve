import type { EntityListRequest, EntityPage } from "./types";

export class LocalEntityLimitError extends Error {
  constructor(limit: number) {
    super(`Local entity-list limit of ${limit} items exceeded`);
    this.name = "LocalEntityLimitError";
  }
}

export interface LocalEntityQueryOptions<TEntity, TFilters extends object> {
  searchText(entity: TEntity): string;
  matchesFilters(entity: TEntity, filters: TFilters): boolean;
  sortValue(entity: TEntity, field: string): string | number | Date | null;
  localItemLimit: number;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase();
}

function compareValues(
  left: string | number | Date | null,
  right: string | number | Date | null,
) {
  if (left === right) return 0;
  if (left === null) return 1;
  if (right === null) return -1;

  if (left instanceof Date || right instanceof Date) {
    return new Date(left).getTime() - new Date(right).getTime();
  }

  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function applyLocalEntityQuery<TEntity, TFilters extends object>(
  items: readonly TEntity[],
  request: EntityListRequest<TFilters>,
  options: LocalEntityQueryOptions<TEntity, TFilters>,
): EntityPage<TEntity> {
  if (items.length > options.localItemLimit) {
    throw new LocalEntityLimitError(options.localItemLimit);
  }

  const search = normalizeSearch(request.search.trim());
  const matching = items.filter(
    (item) =>
      options.matchesFilters(item, request.filters) &&
      (!search || normalizeSearch(options.searchText(item)).includes(search)),
  );

  const sorted = request.sort
    ? matching
        .map((item, index) => ({ item, index }))
        .sort((left, right) => {
          const compared = compareValues(
            options.sortValue(left.item, request.sort!.field),
            options.sortValue(right.item, request.sort!.field),
          );
          if (compared === 0) return left.index - right.index;
          return request.sort!.direction === "asc" ? compared : -compared;
        })
        .map(({ item }) => item)
    : matching;
  const page = Math.max(1, request.page);
  const pageSize = Math.max(1, request.pageSize);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    total: sorted.length,
    page,
    pageSize,
  };
}
