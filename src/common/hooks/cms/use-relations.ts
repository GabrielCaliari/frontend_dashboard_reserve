import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchRelations,
  createRelation,
  deleteRelation,
  reorderRelations,
  type RelationFilters,
  type CreateRelationDto,
  type ReorderRelationDto,
} from '@/src/common/services/cms-media-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { assetKeys } from './use-assets';

/**
 * Query key factory for relations
 * Provides consistent query keys for cache management
 */
export const relationKeys = {
  all: (tenantId: number | null) => ['relations', tenantId] as const,
  lists: (tenantId: number | null) => [...relationKeys.all(tenantId), 'list'] as const,
  list: (tenantId: number | null, filters?: RelationFilters) =>
    [...relationKeys.lists(tenantId), filters] as const,
  byEntity: (tenantId: number | null, entityType: string, entityId: number) =>
    [...relationKeys.lists(tenantId), { entity_type: entityType, entity_id: entityId }] as const,
  byAsset: (tenantId: number | null, assetId: number) =>
    [...relationKeys.lists(tenantId), { asset_id: assetId }] as const,
};

/**
 * Hook to fetch relations with optional filters
 * @param filters - Relation filters (entity_type, entity_id, asset_id)
 * @returns React Query result with relations data
 */
export function useRelations(filters?: RelationFilters) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: relationKeys.list(tenantId, filters),
    queryFn: () => fetchRelations(filters),
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds - relations change moderately
  });
}

/**
 * Hook to attach an asset to an entity (create relation)
 * Invalidates relations cache for the entity on success
 * @returns React Query mutation result
 */
export function useAttachAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateRelationDto) => createRelation(data),
    onSuccess: (newRelation, variables) => {
      // Optimistically add the new relation to the cache
      const entityKey = relationKeys.byEntity(
        tenantId,
        variables.entity_type,
        variables.entity_id
      );

      queryClient.setQueryData(entityKey, (old: any) => {
        if (!old) return [newRelation];
        return [...old, newRelation];
      });

      // Invalidate all relation lists for this entity
      queryClient.invalidateQueries({
        queryKey: relationKeys.byEntity(
          tenantId,
          variables.entity_type,
          variables.entity_id
        ),
      });

      // Invalidate asset lists if the asset was attached
      if (variables.asset_id) {
        queryClient.invalidateQueries({
          queryKey: assetKeys.detail(tenantId, variables.asset_id),
        });
      }
    },
  });
}

/**
 * Hook to detach an asset from an entity (delete relation)
 * Invalidates relations cache on success
 * Uses optimistic updates for better UX
 * @returns React Query mutation result
 */
export function useDetachAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (id: number) => deleteRelation(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: relationKeys.lists(tenantId),
      });

      // Snapshot the previous lists
      const previousLists = queryClient.getQueriesData({
        queryKey: relationKeys.lists(tenantId),
      });

      // Optimistically remove the relation from all list caches
      queryClient.setQueriesData(
        { queryKey: relationKeys.lists(tenantId) },
        (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((relation: any) => relation.id !== id);
        }
      );

      // Return context with the previous lists
      return { previousLists };
    },
    onError: (_error, _id, context) => {
      // Rollback to the previous lists on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all relation lists to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: relationKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to reorder relations by updating display_order values
 * Invalidates relations cache for the entity on success
 * Uses optimistic updates for better UX
 * @returns React Query mutation result
 */
export function useReorderRelations() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (order: ReorderRelationDto[]) => reorderRelations(order),
    onMutate: async (order) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: relationKeys.lists(tenantId),
      });

      // Snapshot the previous lists
      const previousLists = queryClient.getQueriesData({
        queryKey: relationKeys.lists(tenantId),
      });

      // Optimistically update the display_order in all list caches
      queryClient.setQueriesData(
        { queryKey: relationKeys.lists(tenantId) },
        (old: any) => {
          if (!Array.isArray(old)) return old;

          // Create a map of id -> new display_order
          const orderMap = new Map(
            order.map((item) => [item.id, item.display_order])
          );

          // Update display_order for matching relations and sort
          return old
            .map((relation: any) => {
              const newOrder = orderMap.get(relation.id);
              if (newOrder !== undefined) {
                return { ...relation, display_order: newOrder };
              }
              return relation;
            })
            .sort((a: any, b: any) => a.display_order - b.display_order);
        }
      );

      // Return context with the previous lists
      return { previousLists };
    },
    onError: (_error, _order, context) => {
      // Rollback to the previous lists on error
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate all relation lists to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: relationKeys.lists(tenantId),
      });
    },
  });
}
