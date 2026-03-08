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
import type { CmsMediaId, MediaAsset, PaginatedResponse } from '@/src/common/@types/@cms-media';

/**
 * Query key factory for assets
 * Provides consistent query keys for cache management
 */
export const assetKeys = {
  all: (tenantId: string | null) => ['assets', tenantId] as const,
  lists: (tenantId: string | null) => [...assetKeys.all(tenantId), 'list'] as const,
  list: (tenantId: string | null, filters?: AssetFilters, params?: PaginationParams) =>
    [...assetKeys.lists(tenantId), filters, params] as const,
  details: (tenantId: string | null) => [...assetKeys.all(tenantId), 'detail'] as const,
  detail: (tenantId: string | null, id: CmsMediaId) =>
    [...assetKeys.details(tenantId), id] as const,
};

/**
 * Hook to fetch paginated list of assets with optional filters
 */
export function useAssets(filters?: AssetFilters, params?: PaginationParams) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: assetKeys.list(tenantId, filters, params),
    queryFn: () => fetchAssets(filters, params),
    enabled: !!tenantId,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch a single asset by ID
 */
export function useAsset(id: CmsMediaId) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: assetKeys.detail(tenantId, id),
    queryFn: () => fetchAssetById(id),
    enabled: !!tenantId && !!id,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to upload a new asset with progress tracking
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
      setUploadProgress(0);

      queryClient.setQueryData(
        assetKeys.detail(tenantId, newAsset.id),
        newAsset
      );

      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
    onError: () => {
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
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAssetDto }) =>
      updateAsset(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: assetKeys.detail(tenantId, id),
      });

      const previousAsset = queryClient.getQueryData(
        assetKeys.detail(tenantId, id)
      );

      if (previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(tenantId, id),
          { ...previousAsset, ...data }
        );
      }

      return { previousAsset };
    },
    onError: (_error, variables, context) => {
      if (context?.previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(tenantId, variables.id),
          context.previousAsset
        );
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: assetKeys.detail(tenantId, variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
  });
}

/**
 * Hook to delete an asset
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (id: CmsMediaId) => deleteAsset(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: assetKeys.lists(tenantId),
      });

      const previousLists = queryClient.getQueriesData({
        queryKey: assetKeys.lists(tenantId),
      });

      queryClient.setQueriesData(
        { queryKey: assetKeys.lists(tenantId) },
        (old: PaginatedResponse<MediaAsset> | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.filter((asset: any) => asset.id !== id),
            meta: {
              ...old.meta,
              total: Math.max(old.meta.total - 1, 0),
            },
          };
        }
      );

      return { previousLists };
    },
    onError: (_error, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: assetKeys.detail(tenantId, id),
      });
      queryClient.invalidateQueries({
        queryKey: assetKeys.lists(tenantId),
      });
    },
  });
}
