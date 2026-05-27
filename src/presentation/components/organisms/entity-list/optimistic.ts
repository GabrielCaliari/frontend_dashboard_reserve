import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { EntityKey, EntityPage } from "./types";

const ENTITY_LIST_ROOT = "entity-list";

/**
 * Descreve quais paginas cacheadas de entity-list um helper deve atingir. Um
 * id de definicao como `cms-articles-<blog>-<categoria>` se expande em varios
 * ids concretos conforme o escopo de blog/categoria muda, cada um com suas
 * proprias paginas cacheadas. Casar por *prefixo* do id deixa uma mutacao
 * otimista atingir toda variante da mesma lista logica.
 */
export interface EntityListScope {
  idPrefix: string;
}

export function entityListQueryScope(idPrefix: string): EntityListScope {
  return { idPrefix };
}

export interface EntityListSnapshot<TEntity> {
  entries: Array<[QueryKey, EntityPage<TEntity> | undefined]>;
}

function pageQueriesForScope<TEntity>(
  client: QueryClient,
  scope: EntityListScope,
): Array<[QueryKey, EntityPage<TEntity> | undefined]> {
  return client
    .getQueryCache()
    .findAll({ queryKey: [ENTITY_LIST_ROOT], exact: false })
    .filter((query) => {
      const definitionId = query.queryKey[1];
      return (
        typeof definitionId === "string" &&
        definitionId.startsWith(scope.idPrefix)
      );
    })
    .map(
      (query) =>
        [query.queryKey, query.state.data as EntityPage<TEntity> | undefined] as [
          QueryKey,
          EntityPage<TEntity> | undefined,
        ],
    );
}

export function snapshotEntityListPages<TEntity>(
  client: QueryClient,
  scope: EntityListScope,
): EntityListSnapshot<TEntity> {
  return { entries: pageQueriesForScope<TEntity>(client, scope) };
}

export function restoreEntityListSnapshot<TEntity>(
  client: QueryClient,
  snapshot: EntityListSnapshot<TEntity>,
): void {
  for (const [key, data] of snapshot.entries) {
    client.setQueryData(key, data);
  }
}

interface MapPagesOptions<TEntity> {
  scope: EntityListScope;
  mapPage(page: EntityPage<TEntity>): EntityPage<TEntity>;
}

function mapEntityListPages<TEntity>(
  client: QueryClient,
  { scope, mapPage }: MapPagesOptions<TEntity>,
): void {
  for (const [key, data] of pageQueriesForScope<TEntity>(client, scope)) {
    if (!data) continue;
    client.setQueryData<EntityPage<TEntity>>(key, mapPage(data));
  }
}

export interface OptimisticUpdateOptions<
  TEntity,
  TKey extends EntityKey = EntityKey,
> {
  scope: EntityListScope;
  getKey(entity: TEntity): TKey;
  key: TKey;
  update(entity: TEntity): TEntity;
}

export function applyOptimisticEntityUpdate<
  TEntity,
  TKey extends EntityKey = EntityKey,
>(client: QueryClient, options: OptimisticUpdateOptions<TEntity, TKey>): void {
  mapEntityListPages<TEntity>(client, {
    scope: options.scope,
    mapPage: (page) => {
      let changed = false;
      const items = page.items.map((item) => {
        if (options.getKey(item) !== options.key) return item;
        changed = true;
        return options.update(item);
      });
      return changed ? { ...page, items } : page;
    },
  });
}

export interface OptimisticRemoveOptions<
  TEntity,
  TKey extends EntityKey = EntityKey,
> {
  scope: EntityListScope;
  getKey(entity: TEntity): TKey;
  key: TKey;
}

export function removeOptimisticEntity<
  TEntity,
  TKey extends EntityKey = EntityKey,
>(client: QueryClient, options: OptimisticRemoveOptions<TEntity, TKey>): void {
  mapEntityListPages<TEntity>(client, {
    scope: options.scope,
    mapPage: (page) => {
      const items = page.items.filter(
        (item) => options.getKey(item) !== options.key,
      );
      if (items.length === page.items.length) return page;
      return {
        ...page,
        items,
        total: Math.max(0, page.total - (page.items.length - items.length)),
      };
    },
  });
}
