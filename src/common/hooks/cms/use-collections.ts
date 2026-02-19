import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCollections,
  fetchCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  type PaginationParams,
  type CreateCollectionDto,
  type UpdateCollectionDto,
} from '@/src/common/services/cms-media-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

/**
 * Query key factory for collections
 * Provides consistent query keys for cache management
 */
export const collectionKeys = {
  all: (tenantId: number | null) => ['collections', tenantId] as const,
  lists: (tenantId: number | null) => [...collectionKeys.all(tenantId), 'list'] as const,
  list: (tenantId: number | null, params?: PaginationParams) =>
    [...collectionKeys.lists(tenantId), params] as const,
  details: (tenantId: number | null) => [...collectionKeys.all(tenantId), 'detail'] as const,
  detail: (tenantId: number | null, id: number) =>
    [...collectionKeys.details(tenantId), id] as const,
};

/**
 * Hook to fetch paginated list of collections
 * @param params - Pagination parameters (page, limit)
 * @returns React Query result with collections data
 */
export function useCollections(params?: PaginationParams) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: collectionKeys.list(tenantId, params),
    queryFn: () => fetchCollections(params),
    enabled: !!tenantId,
    staleTime: 60 * 1000, // 1 minute - collections don't change frequently
  });
}

/**
 * Hook to fetch a single collection by ID
 * @param id - Collection ID
 * @returns React Query result with collection data
 */
export function useCollection(id: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: collectionKeys.detail(tenantId, id),
    queryFn: () => fetchCollectionById(id),
    enabled: !!tenantId && !!id,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a new collection
 * Invalidates collections list cache on success
 * @returns React Query mutation result
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateCollectionDto) => createCollection(data),
    onSuccess: () => {
      // Invalidate all collection lists to refetch with new data
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to update an existing collection
 * Invalidates both the specific collection and lists cache on success
 * @returns React Query mutation result
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCollectionDto }) =>
      updateCollection(id, data),
    onSuccess: (_data, variables) => {
      // Invalidate the specific collection detail
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(tenantId, variables.id),
      });
      // Invalidate all collection lists
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to delete a collection
 * Invalidates collections list cache on success
 * @returns React Query mutation result
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: (_data, id) => {
      // Remove the specific collection from cache
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(tenantId, id),
      });
      // Invalidate all collection lists
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}
