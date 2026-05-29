"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import {
  createEmptySelection,
  getSelectedCount,
  selectAllMatching,
  toggleEntityKey,
  type EntitySelection,
} from "./selection";
import type { EntityKey, EntityListDefinition } from "./types";
import { useEntityListState } from "./use-entity-list-state";

interface UseEntityListControllerOptions<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey,
> {
  definition: EntityListDefinition<TEntity, TFilters, TKey>;
  stateMode?: "memory" | "url";
  searchDebounceMs?: number;
}

export function useEntityListController<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey = EntityKey,
>({
  definition,
  stateMode,
  searchDebounceMs,
}: UseEntityListControllerOptions<TEntity, TFilters, TKey>) {
  const initialState = useMemo(
    () => ({
      page: 1,
      pageSize: definition.initialState.pageSize,
      search: "",
      sort: definition.initialState.sort,
      filters: definition.initialState.filters,
    }),
    [definition.initialState],
  );
  const listState = useEntityListState({
    initialState,
    mode: stateMode,
    searchDebounceMs,
  });
  const [selection, setSelection] = useState<EntitySelection<TKey>>(() =>
    createEmptySelection<TKey>(),
  );
  const tenantId = useSelectedTenantId();
  const tenantCacheScope = tenantId ?? "none";

  const query = useQuery({
    queryKey: ["entity-list", definition.id, tenantCacheScope, listState.state],
    queryFn: () => definition.dataSource.query(listState.state),
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[2] === tenantCacheScope
        ? keepPreviousData(previousData)
        : undefined,
  });

  const querySignature = JSON.stringify([tenantCacheScope, listState.state]);
  useEffect(() => {
    setSelection(createEmptySelection<TKey>());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [querySignature]);

  const page = query.data;

  const setPage = listState.setPage;
  const lastPage =
    page && page.total > 0 ? Math.max(1, Math.ceil(page.total / page.pageSize)) : null;
  const currentPage = page?.page ?? null;
  useEffect(() => {
    if (lastPage === null || currentPage === null) return;
    if (currentPage > lastPage) setPage(lastPage);
  }, [currentPage, lastPage, setPage]);
  const selectedCount = getSelectedCount(selection, page?.total ?? 0);

  return {
    ...listState,
    query,
    page,
    selection,
    selectedCount,
    toggleSelection: (key: TKey) =>
      setSelection((current) => {
        if (definition.dataSource.capabilities.selection !== "single") {
          return toggleEntityKey(current, key);
        }

        if (current.mode === "explicit" && current.keys.has(key)) {
          return createEmptySelection<TKey>();
        }
        return { mode: "explicit", keys: new Set([key]) };
      }),
    selectAllMatching: () => {
      if (definition.dataSource.capabilities.selection === "multiple") {
        setSelection(selectAllMatching<TKey>());
      }
    },
    clearSelection: () => setSelection(createEmptySelection<TKey>()),
  };
}
