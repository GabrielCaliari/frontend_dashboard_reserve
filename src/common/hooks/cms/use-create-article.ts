import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createArticle } from "@/src/common/services/cms-article-service";
import type { CreateArticleDto } from "@/src/common/@types/@cms-article";
import { useSelectedTenantId } from "@/src/common/stores/tenant-store";
import { ARTICLE_QUERY_KEYS } from "./useArticles";

export function useCreateArticle(blogId: string) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateArticleDto) => createArticle({ ...data, blogId }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, parseInt(blogId, 10)),
      });
    },
  });
}
