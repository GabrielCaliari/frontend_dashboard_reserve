import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteArticle } from "@/src/common/services/cms-article-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import { ARTICLE_QUERY_KEYS } from "./useArticles";

export function useDeleteArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (articleId: string) => deleteArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cms", "articles"] });
    },
  });
}
