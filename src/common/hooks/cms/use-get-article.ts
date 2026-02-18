import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useGetArticle(blogId: number, articleId: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['article', tenantId, blogId, articleId],
    queryFn: () => articleService.getArticle(blogId, articleId),
    enabled: !!blogId && !!articleId && !!tenantId,
  });
}
