"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseEntityListQuery, serializeEntityListQuery } from "./query-state";
import type { EntityListRequest, EntitySort } from "./types";

type EntityListStateMode = "memory" | "url";

interface UseEntityListStateOptions<TFilters extends Record<string, unknown>> {
  initialState: EntityListRequest<TFilters>;
  mode?: EntityListStateMode;
  searchDebounceMs?: number;
}

export function useEntityListState<TFilters extends Record<string, unknown>>({
  initialState,
  mode = "memory",
  searchDebounceMs = 300,
}: UseEntityListStateOptions<TFilters>) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const latestSearchParams = useRef(searchParamsString);
  const latestPathname = useRef(pathname);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memoryState, setMemoryState] = useState(initialState);

  if (latestSearchParams.current !== searchParamsString) {
    latestSearchParams.current = searchParamsString;
  }
  latestPathname.current = pathname;

  const urlState = useMemo(
    () =>
      parseEntityListQuery(
        new URLSearchParams(searchParamsString),
        initialState.filters,
      ),
    [initialState.filters, searchParamsString],
  );
  const state =
    mode === "url"
      ? { ...urlState, pageSize: urlState.pageSize || initialState.pageSize }
      : memoryState;
  const [searchInput, setSearchInput] = useState(state.search);

  useEffect(() => {
    setSearchInput(state.search);
  }, [state.search]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const commit = useCallback(
    (nextState: EntityListRequest<TFilters>) => {
      if (mode === "memory") {
        setMemoryState(nextState);
        return;
      }

      const current = new URLSearchParams(latestSearchParams.current);
      const encoded = serializeEntityListQuery(nextState);
      const managedKeys = new Set([
        "page",
        "limit",
        "q",
        "sort",
        "direction",
        ...Object.keys(initialState.filters),
      ]);

      managedKeys.forEach((key) => current.delete(key));
      const nextParams = new URLSearchParams(encoded);
      current.forEach((value, key) => nextParams.append(key, value));

      const suffix = nextParams.toString();
      latestSearchParams.current = suffix;
      router.replace(
        suffix ? `${latestPathname.current}?${suffix}` : latestPathname.current,
        { scroll: false },
      );
    },
    [initialState.filters, mode, router],
  );

  const update = useCallback(
    (changes: Partial<EntityListRequest<TFilters>>, resetPage = true) => {
      commit({
        ...state,
        ...changes,
        page: resetPage ? 1 : (changes.page ?? state.page),
        filters: changes.filters ?? state.filters,
      });
    },
    [commit, state],
  );

  const setSearch = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        update({ search: value.trim() });
        searchTimer.current = null;
      }, searchDebounceMs);
    },
    [searchDebounceMs, update],
  );

  const setFilter = useCallback(
    <TKey extends Extract<keyof TFilters, string>>(
      key: TKey,
      value: TFilters[TKey],
    ) => {
      update({ filters: { ...state.filters, [key]: value } });
    },
    [state.filters, update],
  );

  const setSort = useCallback(
    (sort?: EntitySort) => update({ sort }),
    [update],
  );

  const setPage = useCallback(
    (page: number) => update({ page: Math.max(1, Math.floor(page) || 1) }, false),
    [update],
  );

  const setPageSize = useCallback(
    (pageSize: number) =>
      update({ pageSize: Math.max(1, Math.floor(pageSize) || 1) }),
    [update],
  );

  const clearFilters = useCallback(
    () => update({ filters: initialState.filters }),
    [initialState.filters, update],
  );

  return {
    state,
    searchInput,
    setSearch,
    setFilter,
    setSort,
    setPage,
    setPageSize,
    clearFilters,
  };
}
