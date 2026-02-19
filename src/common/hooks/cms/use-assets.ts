import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAssets,
  fetchAssetById,
  uploadAsset,
  updateAsset,
  deleteAsset,
  type PaginationParams,
  type AssetFilters,
  type UploadAssetDto,
  type UpdateAssetDto,
} from '@/src/common/services/cms-media-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { useState } from 'react';

/**
 * Query key factory for assets
 * Provides consistent query keys for cache management
 */
export const assetKeys = {
  all: (tenantId: number | null) => ['assets', tenantId] as const,
  lists: (tenantId: number | null) => [...assetKeys.all(tenantId), 'list'] as const,
  list: (tenantId: number | null, filters?: AssetFilters, params?: PaginationParams) =>
    [...assetKeys.lists(tenantId), filters, params] as const,
  details: (tenantId: number | null) => [...assetKeys.all(tenantId), 'detail'] as const,
  detail: (tenantId: number | null, id: number) =>
    [...assetKeys.details(tenantId), id] as const,
};

/**
 * Hook to fetch paginated list of assets with optional filters
 * @param filters - Asset filters (collection_id, status, search)
 * @param params - Pagination parameters (page, limit)
 * @returns React Query result with assets data
 */
export function useAssets(filters?: AssetFilters, params?: PaginationParams) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: assetKeys.list(tenantId, filters, params),
    queryFn: () => fetchAssets(filters, params),
    enabled: !!tenantId,
    staleTime: 30 * 1000, // 30 seconds - assets change more frequently than collections
  });
}

/**
 * Hook to fetch a single asset by ID
 * @param id - Asset ID
 * @returns React Query result with asset data
 */
export function useAsset(id: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: assetKeys.detail(tenantId, id),
    queryFn: () => fetchAssetById(id),
    enabled: !!tenantId && !!id,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to upload a new asset with progress tracking
 * Invalidates assets list cache on success
 * @returns React Query mutation result with upload progress state
 */
export function useUploadAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const mutation = useMutation({
    mutationFn: (data: UploadAssetDto) =>
      uploadAsset(data, (progress) => {
        setUploadProgress(progress);
      }),
    onSuccess: (newAsset) => {
      // Reset progress
      setUploadProgress(0);

      // Optimistically add the new asset to the cache
      queryClient.setQueryData(
        assetKeys.detail(tenantId, newAsset.id),
        newAsset
      );

      // Invalidate all asset lists to refetch with new data
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
    onError: () => {
      // Reset progress on error
      setUploadProgress(0);
    },
  });

  return {
    ...mutation,
    uploadProgress,
  };
}

/**
 * Hook to update asset metadata
 * Invalidates both the specific asset and lists cache on success
 * Uses optimistic updates for better UX
 * @returns React Query mutation result
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetDto }) =>
      updateAsset(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: assetKeys.detail(tenantId, id),
      });

      // Snapshot the previous value
      const previousAsset = queryClient.getQueryData(
        assetKeys.detail(tenantId, id)
      );

      // Optimistically update to the new value
      if (previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(tenantId, id),
          { ...previousAsset, ...data }
        );
      }

      // Return context with the previous value
      return { previousAsset };
    },
    onError: (_error, variables, context) => {
      // Rollback to the previous value on error
      if (context?.previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(tenantId, variables.id),
          context.previousAsset
        );
      }
    },
    onSuccess: (_data, variables) => {
      // Invalidate the specific asset detail to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: assetKeys.detail(tenantId, variables.id),
      });
      // Invalidate all asset lists
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to delete an asset
 * Invalidates assets list cache on success
 * Uses optimistic updates for better UX
 * @returns React Query mutation result
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (id: number) => deleteAsset(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: assetKeys.lists(tenantId),
      });

      // Snapshot the previous lists
      const previousLists = queryClient.getQueriesData({
        queryKey: assetKeys.lists(tenantId),
      });

      // Optimistically remove the asset from all list caches
      queryClient.setQueriesData(
        { queryKey: assetKeys.lists(tenantId) },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((asset: any) => asset.id !== id),
            meta: {
              ...old.meta,
              total: old.meta.total - 1,
            },
          };
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
    onSuccess: (_data, id) => {
      // Remove the specific asset from cache
      queryClient.removeQueries({
        queryKey: assetKeys.detail(tenantId, id),
      });
      // Invalidate all asset lists to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
  });
}
