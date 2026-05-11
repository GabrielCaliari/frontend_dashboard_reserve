import { useQuery } from "@tanstack/react-query";
import { fetchArticleById } from "@/src/modules/cms/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useGetArticle(articleId: string, blogId?: string) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ["cms", "article", tenantId, articleId],
    queryFn: () => fetchArticleById(articleId),
    enabled: !!articleId && !!tenantId,
  });
}
