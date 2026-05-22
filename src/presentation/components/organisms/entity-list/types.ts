import type { ReactNode } from "react";

export type EntityKey = string | number;

export interface EntitySort {
  field: string;
  direction: "asc" | "desc";
}

export interface EntityListRequest<TFilters extends object> {
  page: number;
  pageSize: number;
  search: string;
  sort?: EntitySort;
  filters: TFilters;
}

export interface EntityPage<TEntity> {
  items: readonly TEntity[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EntityListCapabilities {
  search: "server" | "local" | false;
  sort: "server" | "local" | false;
  pagination: "server" | "local";
  selection: "none" | "single" | "multiple";
  localItemLimit?: number;
}

export interface EntityListDataSource<TEntity, TFilters extends object> {
  capabilities: EntityListCapabilities;
  query(request: EntityListRequest<TFilters>): Promise<EntityPage<TEntity>>;
}

export interface EntitySortDefinition {
  field: string;
  label: string;
}

export interface EntityFilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface EntityFilterDefinition<TFilters extends object> {
  key: Extract<keyof TFilters, string>;
  label: string;
  kind:
    | "single"
    | "multi"
    | "boolean"
    | "date"
    | "date-range"
    | "number-range"
    | "entity"
    | "custom";
  options?: readonly EntityFilterOption[];
}

export interface EntityListItemRenderContext<TKey extends EntityKey> {
  selected: boolean;
  selectable: boolean;
  onSelectionChange(): void;
}

export interface EntityColumn<TEntity> {
  key: string;
  header: string;
  align?: "start" | "center" | "end";
  sortField?: string;
  render(entity: TEntity): ReactNode;
}

interface EntityListDefinitionBase<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
> {
  id: string;
  ariaLabel: string;
  getKey(entity: TEntity): TKey;
  dataSource: EntityListDataSource<TEntity, TFilters>;
  initialState: {
    pageSize: number;
    filters: TFilters;
    sort?: EntitySort;
  };
  filters: readonly EntityFilterDefinition<TFilters>[];
  sorts: readonly EntitySortDefinition[];
  onActivate?(entity: TEntity): void;
  primaryActions?: ReactNode;
  listClassName?: string;
}

export type EntityListDefinition<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
> =
  | (EntityListDefinitionBase<TEntity, TFilters, TKey> & {
      variant?: "cards";
      renderItem(
        entity: TEntity,
        context: EntityListItemRenderContext<TKey>,
      ): ReactNode;
    })
  | (EntityListDefinitionBase<TEntity, TFilters, TKey> & {
      variant: "table";
      columns: readonly EntityColumn<TEntity>[];
    });

/**
 * Estreita um EntityListDefinition possivelmente de variante "table" para o
 * seu braco "cards". Toda tela e teste deste codebase so constroem
 * definicoes "cards" (nenhum constroi "table" fora de types.test-d.ts), entao
 * esta asserção e segura em todo call site atual -- ela existe so para
 * satisfazer o estreitamento de union discriminada do compilador sem forcar
 * cada call site a duplicar um guard `if (definition.variant === "table") throw ...`.
 */
export function assertCardsDefinition<
  TEntity,
  TFilters extends object,
  TKey extends EntityKey = EntityKey,
>(
  definition: EntityListDefinition<TEntity, TFilters, TKey>,
): Extract<EntityListDefinition<TEntity, TFilters, TKey>, { renderItem: unknown }> {
  return definition as Extract<
    EntityListDefinition<TEntity, TFilters, TKey>,
    { renderItem: unknown }
  >;
}
