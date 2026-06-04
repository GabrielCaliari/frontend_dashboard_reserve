"use client";

import { Fragment } from "react";
import { EntityListFilters } from "./entity-list-filters";
import { EntityListLayout } from "./entity-list-layout";
import { EntityListPagination } from "./entity-list-pagination";
import { EntityListStates } from "./entity-list-states";
import { EntityListTable } from "./entity-list-table";
import { EntityListToolbar } from "./entity-list-toolbar";
import type { EntityKey, EntityListDefinition } from "./types";
import { useEntityListController } from "./use-entity-list-controller";

interface EntityListProps<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey,
> {
  definition: EntityListDefinition<TEntity, TFilters, TKey>;
  stateMode?: "memory" | "url";
  searchDebounceMs?: number;
}

export function EntityList<
  TEntity,
  TFilters extends Record<string, unknown>,
  TKey extends EntityKey = EntityKey,
>({
  definition,
  stateMode,
  searchDebounceMs,
}: EntityListProps<TEntity, TFilters, TKey>) {
  const controller = useEntityListController({
    definition,
    stateMode,
    searchDebounceMs,
  });
  const canSelect = definition.dataSource.capabilities.selection !== "none";
  const page = controller.page;
  const showInitialLoading = controller.query.isLoading && !page;

  return (
    <EntityListLayout
      filters={
        definition.filters.length > 0 ? (
          <EntityListFilters
            definitions={definition.filters}
            values={controller.state.filters}
            onChange={(key, value) =>
              controller.setFilter(key, value as TFilters[typeof key])
            }
          />
        ) : undefined
      }
      toolbar={
        <EntityListToolbar
          actions={definition.primaryActions}
          searchValue={controller.searchInput}
          onSearchChange={controller.setSearch}
          showSearch={definition.dataSource.capabilities.search !== false}
        />
      }
      bulkBar={
        canSelect && controller.selectedCount > 0 ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground">
            {`${controller.selectedCount} selecionado(s)`}
          </div>
        ) : undefined
      }
      pagination={
        page ? (
          <EntityListPagination
            page={page.page}
            pageSize={page.pageSize}
            totalItems={page.total}
            onPageChange={controller.setPage}
          />
        ) : undefined
      }
    >
      {showInitialLoading ? <EntityListStates state="loading" /> : null}
      {controller.query.isError ? (
        <EntityListStates
          state="error"
          onRetry={() => void controller.query.refetch()}
        />
      ) : null}
      {!showInitialLoading && !controller.query.isError && page?.items.length === 0 ? (
        <EntityListStates state="empty" />
      ) : null}
      {!showInitialLoading && !controller.query.isError && page && page.items.length > 0 ? (
        definition.variant === "table" ? (
          <EntityListTable
            ariaLabel={definition.ariaLabel}
            columns={definition.columns}
            items={page.items}
            getKey={definition.getKey}
            onActivate={definition.onActivate}
            selection={
              canSelect
                ? {
                    isSelected: (key) =>
                      controller.selection.mode === "allMatching"
                        ? !controller.selection.excludedKeys.has(key)
                        : controller.selection.keys.has(key),
                    onToggle: (key) => controller.toggleSelection(key),
                  }
                : undefined
            }
          />
        ) : (
          <ul
            aria-label={definition.ariaLabel}
            className={
              definition.listClassName ??
              "overflow-hidden rounded-xl border border-divider bg-content1"
            }
          >
            {page.items.map((entity) => {
              const key = definition.getKey(entity);
              const selected =
                controller.selection.mode === "allMatching"
                  ? !controller.selection.excludedKeys.has(key)
                  : controller.selection.keys.has(key);
              return (
                <Fragment key={key}>
                  {definition.renderItem(entity, {
                    selected,
                    selectable: canSelect,
                    onSelectionChange: () => controller.toggleSelection(key),
                  })}
                </Fragment>
              );
            })}
          </ul>
        )
      ) : null}
    </EntityListLayout>
  );
}
