import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteArticle } from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useDeleteArticle(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (articleId: number) => deleteArticle(blogId, articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
    },
  });
}
