import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useDeleteArticle(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (articleId: number) => articleService.deleteArticle(blogId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
    },
  });
}
