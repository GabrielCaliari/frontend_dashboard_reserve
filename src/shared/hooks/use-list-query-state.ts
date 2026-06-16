"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UseListQueryStateOptions<K extends string> {
  filterKeys?: readonly K[];
  queryKey?: string;
  pageKey?: string;
  searchDebounceMs?: number;
}

export function useListQueryState<K extends string = string>({
  filterKeys = [] as readonly K[],
  queryKey = "q",
  pageKey = "page",
  searchDebounceMs = 300,
}: UseListQueryStateOptions<K> = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const renderedSearchParams = searchParams.toString();
  const latestSearchParams = useRef(renderedSearchParams);
  const lastRenderedSearchParams = useRef(renderedSearchParams);
  const latestPathname = useRef(pathname);
  if (renderedSearchParams !== lastRenderedSearchParams.current) {
    lastRenderedSearchParams.current = renderedSearchParams;
    latestSearchParams.current = renderedSearchParams;
  }
  latestPathname.current = pathname;
  const urlQuery = searchParams.get(queryKey) ?? "";
  const [query, setQueryInput] = useState(urlQuery);
  const lastUrlQuery = useRef(urlQuery);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const parsedPage = Number(searchParams.get(pageKey) ?? "1");
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const filters = useMemo(
    () =>
      Object.fromEntries(
        filterKeys.map((key) => [key, searchParams.get(key) ?? ""]),
      ) as Record<K, string>,
    [filterKeys, searchParams],
  );

  const update = useCallback(
    (changes: Record<string, string | number | null>) => {
      const next = new URLSearchParams(latestSearchParams.current);
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === "" || (key === pageKey && value === 1))
          next.delete(key);
        else next.set(key, String(value));
      });
      const suffix = next.toString();
      latestSearchParams.current = suffix;
      router.replace(
        suffix ? `${latestPathname.current}?${suffix}` : latestPathname.current,
        { scroll: false },
      );
    },
    [pageKey, router],
  );

  useEffect(() => {
    if (urlQuery !== lastUrlQuery.current) {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current);
        searchTimer.current = null;
      }
      lastUrlQuery.current = urlQuery;
      setQueryInput(urlQuery);
    }
  }, [urlQuery]);

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );

  const setQuery = useCallback(
    (value: string) => {
      setQueryInput(value);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => {
        update({ [queryKey]: value.trim(), [pageKey]: null });
        searchTimer.current = null;
      }, searchDebounceMs);
    },
    [pageKey, queryKey, searchDebounceMs, update],
  );

  return {
    query,
    page,
    filters,
    setQuery,
    setPage: useCallback(
      (value: number) => update({ [pageKey]: Math.max(1, Math.floor(value) || 1) }),
      [pageKey, update],
    ),
    setFilter: useCallback(
      (key: K, value: string) => update({ [key]: value, [pageKey]: null }),
      [pageKey, update],
    ),
    clearFilters: useCallback(
      () =>
        update({
          ...Object.fromEntries(filterKeys.map((key) => [key, null])),
          [pageKey]: null,
        }),
      [filterKeys, pageKey, update],
    ),
  };
}
