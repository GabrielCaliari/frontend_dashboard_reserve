import { useQuery } from '@tanstack/react-query';
import { fetchArticles } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useListArticles(blogId: number, _page = 1, _limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['articles', tenantId, blogId],
    queryFn: () => fetchArticles(blogId),
    enabled: !!blogId && !!tenantId,
  });
}
