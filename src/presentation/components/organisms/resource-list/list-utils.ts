export interface FilterResourcesOptions<T, K extends string> {
  query?: string;
  searchBy: (resource: T) => string | readonly string[];
  filters?: Partial<Record<K, string>>;
  filterBy?: Partial<Record<K, (resource: T) => string | readonly string[]>>;
}

const normalize = (value: string) => value.trim().toLocaleLowerCase();
const asValues = (value: string | readonly string[]) =>
  Array.isArray(value) ? value : [value];

export function filterResources<T, K extends string = string>(
  resources: readonly T[],
  options: FilterResourcesOptions<T, K>,
): T[] {
  const query = normalize(options.query ?? "");
  const activeFilters = Object.entries(options.filters ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );

  activeFilters.forEach(([key]) => {
    if (!options.filterBy?.[key as K]) {
      throw new Error(`Missing filter selector for "${key}"`);
    }
  });

  return resources.filter((resource) => {
    const matchesQuery =
      !query ||
      asValues(options.searchBy(resource)).some((value) =>
        normalize(value).includes(query),
      );

    const matchesFilters = activeFilters.every(([key, expected]) => {
      const selector = options.filterBy![key as K]!;
      return asValues(selector(resource)).includes(expected);
    });

    return matchesQuery && matchesFilters;
  });
}

export interface PaginatedResources<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function paginateResources<T>(
  resources: readonly T[],
  requestedPage: number,
  pageSize: number,
): PaginatedResources<T> {
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(resources.length / safePageSize));
  const page = Math.min(totalPages, Math.max(1, Math.floor(requestedPage) || 1));
  const start = (page - 1) * safePageSize;

  return { items: resources.slice(start, start + safePageSize), page, totalPages };
}
