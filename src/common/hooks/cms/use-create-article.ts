import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createArticle } from '@/src/common/services/cms-article-service';
import type { CreateArticleDto } from '@/src/common/@types/@cms-article';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useCreateArticle(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateArticleDto) => createArticle(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles', tenantId, blogId] });
    },
  });
}
