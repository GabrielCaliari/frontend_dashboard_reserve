import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import type { ArticleCreateInput } from '@/src/common/@types/@article';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useCreateArticle(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: ArticleCreateInput) => articleService.createArticle(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
    },
  });
}
