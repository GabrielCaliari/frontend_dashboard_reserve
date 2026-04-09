import { useQuery } from "@tanstack/react-query";
import { fetchArticles } from "@/src/common/services/cms-article-service";
import { useSelectedTenantId } from "@/src/common/stores/tenant-store";
import { ARTICLE_QUERY_KEYS } from "./useArticles";

export function useListArticles(
  blogId?: number | string,
  page = 1,
  limit = 30,
) {
  const tenantId = useSelectedTenantId();
  const parsedBlogId = blogId
    ? typeof blogId === "string"
      ? parseInt(blogId, 10)
      : blogId
    : undefined;

  return useQuery({
    queryKey: parsedBlogId
      ? [...ARTICLE_QUERY_KEYS.all(tenantId, parsedBlogId), { page, limit }]
      : ["cms", "articles", tenantId, { page, limit }],
    queryFn: () => fetchArticles(blogId, undefined, page, limit),
    enabled: !!tenantId,
    retry: 2,
    staleTime: 30 * 1000,
  });
}
