import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useListArticles(blogId: number | string, page = 1, limit = 30) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['articles', tenantId, blogId, page, limit],
    queryFn: () => fetchArticles(blogId, undefined, page, limit),
    enabled: !!blogId && !!tenantId,
    retry: 2,
    staleTime: 30 * 1000,
  });
}
