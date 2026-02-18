import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useListArticles(blogId: number, page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['articles', tenantId, blogId, page, limit],
    queryFn: () => articleService.listArticles(blogId, page, limit),
    enabled: !!blogId && !!tenantId,
  });
}
