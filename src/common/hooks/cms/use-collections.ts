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
  all: (tenantId: string | null) => ['collections', tenantId] as const,
  lists: (tenantId: string | null) => [...collectionKeys.all(tenantId), 'list'] as const,
  list: (tenantId: string | null, params?: PaginationParams) =>
    [...collectionKeys.lists(tenantId), params] as const,
  details: (tenantId: string | null) => [...collectionKeys.all(tenantId), 'detail'] as const,
  detail: (tenantId: string | null, id: number) =>
    [...collectionKeys.details(tenantId), id] as const,
};

/**
 * Hook to fetch paginated list of collections
 */
export function useCollections(params?: PaginationParams) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: collectionKeys.list(tenantId, params),
    queryFn: () => fetchCollections(params),
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch a single collection by ID
 */
export function useCollection(id: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: collectionKeys.detail(tenantId, id),
    queryFn: () => fetchCollectionById(id),
    enabled: !!tenantId && !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to create a new collection
 */
export function useCreateCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateCollectionDto) => createCollection(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to update an existing collection
 */
export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCollectionDto }) =>
      updateCollection(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: collectionKeys.detail(tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to delete a collection
 */
export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (id: number) => deleteCollection(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: collectionKeys.detail(tenantId, id),
      });
      queryClient.invalidateQueries({
        queryKey: collectionKeys.lists(tenantId),
      });
    },
  });
}
