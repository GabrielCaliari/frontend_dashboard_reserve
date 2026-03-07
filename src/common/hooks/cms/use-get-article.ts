import { useQuery } from '@tanstack/react-query';
import { fetchArticleById } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useGetArticle(blogId: number, articleId: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['article', tenantId, blogId, articleId],
    queryFn: () => fetchArticleById(articleId),
    enabled: !!blogId && !!articleId && !!tenantId,
  });
}
