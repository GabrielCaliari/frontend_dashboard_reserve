import { fetchArticles } from "@/src/modules/cms/infrastructure/article-adapters";
import { applyLocalEntityQuery } from "@/src/presentation/components/organisms/entity-list/local-query";
import type {
  EntityListRequest,
  EntityPage,
} from "@/src/presentation/components/organisms/entity-list/types";
import type { Article, ArticleStatus } from "@/src/shared/domain/types/@cms-article";

export interface ArticleEntityFilters extends Record<string, unknown> {
  status: string;
}

export const ARTICLE_LOCAL_ITEM_LIMIT = 500;

export function queryArticleEntityList(blogId?: string) {
  return async (
    request: EntityListRequest<ArticleEntityFilters>,
  ): Promise<EntityPage<Article>> => {
    const articles = await fetchArticles(blogId, undefined, 1, ARTICLE_LOCAL_ITEM_LIMIT);

    return applyLocalEntityQuery(articles, request, {
      localItemLimit: ARTICLE_LOCAL_ITEM_LIMIT,
      searchText: (article) => `${article.title} ${article.slug}`,
      matchesFilters: (article, filters) =>
        !filters.status || article.status === (filters.status as ArticleStatus),
      sortValue: (article, field) =>
        field === "updated_at" ? new Date(article.published_at ?? article.updated_at) : null,
    });
  };
}
