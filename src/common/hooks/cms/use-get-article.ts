import { useQuery } from '@tanstack/react-query';
import { fetchArticleById } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useGetArticle(articleId: string, blogId?: string) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['cms', 'article', tenantId, articleId],
    queryFn: () => fetchArticleById(articleId),
    enabled: !!articleId && !!tenantId,
  });
}
