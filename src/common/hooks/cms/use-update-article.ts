import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateArticle } from '@/src/common/services/cms-article-service';
import type { UpdateArticleDto } from '@/src/common/@types/@cms-article';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useUpdateArticle(blogId: string) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: UpdateArticleDto & { id: string }) => {
      const { id, ...updateData } = data;
      return updateArticle(blogId, id, updateData);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
      queryClient.invalidateQueries({ queryKey: ['article', tenantId, blogId, variables.id] });
    },
  });
}
