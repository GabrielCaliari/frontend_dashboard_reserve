import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateArticle } from '@/src/common/services/cms-article-service';
import type { UpdateArticleDto } from '@/src/common/@types/@cms-article';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { ARTICLE_QUERY_KEYS } from './useArticles';

export function useUpdateArticle(blogId: string) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: UpdateArticleDto & { id: string }) => {
      const { id, ...updateData } = data;
      return updateArticle(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms', 'articles'] });
    },
  });
}
