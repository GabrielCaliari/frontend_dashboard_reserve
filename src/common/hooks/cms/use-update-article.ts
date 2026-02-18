import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import type { ArticleUpdateInput } from '@/src/common/@types/@article';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useUpdateArticle(blogId: number, articleId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: ArticleUpdateInput) => articleService.updateArticle(blogId, articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
      queryClient.invalidateQueries({ queryKey: ['article', tenantId, blogId, articleId] });
    },
  });
}
