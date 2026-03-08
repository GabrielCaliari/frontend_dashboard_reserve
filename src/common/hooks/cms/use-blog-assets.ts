import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CmsMediaId, MediaAsset, PaginatedResponse } from '@/src/common/@types/@cms-media';
import { fetchBlogAssets, uploadBlogAsset } from '@/src/common/services/cms-blog-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export const blogAssetKeys = {
  all: (tenantId: string | null, blogId: string | number) => ['cms', 'blog-assets', tenantId, blogId] as const,
  list: (tenantId: string | null, blogId: string | number, params?: { page?: number; limit?: number }) =>
    [...blogAssetKeys.all(tenantId, blogId), params] as const,
};

export function useBlogAssets(blogId?: string | number, params?: { page?: number; limit?: number }) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: blogId != null ? blogAssetKeys.list(tenantId, blogId, params) : ['cms', 'blog-assets', tenantId, 'disabled'],
    queryFn: () => fetchBlogAssets(blogId as string | number, params),
    enabled: !!tenantId && blogId != null && blogId !== '',
    staleTime: 30 * 1000,
  });
}

export function useUploadBlogAsset(blogId?: string | number) {
  const tenantId = useSelectedTenantId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { file: File; alt_text?: string; metadata?: Record<string, unknown> }) =>
      uploadBlogAsset(blogId as string | number, data),
    onSuccess: (asset) => {
      if (blogId == null || blogId === '') {
        return;
      }

      queryClient.setQueriesData(
        { queryKey: blogAssetKeys.all(tenantId, blogId) },
        (old: PaginatedResponse<MediaAsset> | undefined) => {
          if (!old) return old;

          return {
            ...old,
            data: [asset, ...old.data],
            meta: {
              ...old.meta,
              total: old.meta.total + 1,
            },
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: blogAssetKeys.all(tenantId, blogId) });
    },
  });
}