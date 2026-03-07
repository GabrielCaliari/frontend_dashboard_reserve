import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteArticle } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { ARTICLE_QUERY_KEYS } from './useArticles';

export function useDeleteArticle(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (articleId: number) => deleteArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId) });
    },
  });
}
