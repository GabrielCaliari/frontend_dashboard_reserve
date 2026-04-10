import { useQuery } from "@tanstack/react-query";
import {
  fetchPublicArticles,
  fetchPublicArticleBySlug,
  type PublicArticlesParams,
  type PublicArticlesResponse,
} from "@/src/common/services/cms-public-service";
import type { Article } from "@/src/shared/domain/types/@cms-article";

/**
 * Query keys for public article queries
 * Used for cache management and invalidation
 *
 * Keys include the secret key to ensure different blogs have separate caches
 */
export const PUBLIC_ARTICLE_QUERY_KEYS = {
  all: (secretKey: string, page: number, limit: number) =>
    ["cms", "public", "articles", secretKey, { page, limit }] as const,
  detail: (secretKey: string, slug: string) =>
    ["cms", "public", "articles", secretKey, slug] as const,
};

/**
 * Hook to fetch paginated list of published articles from a blog
 *
 * This hook is designed for public frontend consumption and uses longer
 * staleTime (10 minutes) since public content changes less frequently.
 *
 * @param secretKey - Blog secret key for authentication
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10, max: 50)
 * @returns Query result with paginated articles and metadata
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = usePublicArticles(
 *   'blog-secret-key',
 *   1,
 *   10
 * );
 *
 * if (data) {
 *   console.log(data.data); // Array of articles
 *   console.log(data.meta.total_pages); // Total pages
 * }
 * ```
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 15.1, 15.2, 15.3, 15.4, 15.5
 */
export const usePublicArticles = (
  secretKey: string,
  page: number = 1,
  limit: number = 10,
) => {
  return useQuery<PublicArticlesResponse, Error>({
    queryKey: PUBLIC_ARTICLE_QUERY_KEYS.all(secretKey, page, limit),
    queryFn: () => fetchPublicArticles(secretKey, { page, limit }),
    enabled: !!secretKey, // Only run query if secret key is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - public content changes less frequently
  });
};

/**
 * Hook to fetch a single published article by its slug
 *
 * This hook is designed for public article detail pages and uses longer
 * staleTime (10 minutes) since public content changes less frequently.
 *
 * @param secretKey - Blog secret key for authentication
 * @param slug - URL-friendly article identifier
 * @returns Query result with article data including images
 *
 * @example
 * ```tsx
 * const { data: article, isLoading, error } = usePublicArticleBySlug(
 *   'blog-secret-key',
 *   'my-article-slug'
 * );
 *
 * if (article) {
 *   console.log(article.title);
 *   console.log(article.content);
 *   console.log(article.images); // Array of article images
 * }
 * ```
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 15.1, 15.2, 15.3, 15.4
 */
export const usePublicArticleBySlug = (secretKey: string, slug: string) => {
  return useQuery<Article, Error>({
    queryKey: PUBLIC_ARTICLE_QUERY_KEYS.detail(secretKey, slug),
    queryFn: () => fetchPublicArticleBySlug(secretKey, slug),
    enabled: !!secretKey && !!slug, // Only run query if both parameters are provided
    staleTime: 10 * 60 * 1000, // 10 minutes - public content changes less frequently
  });
};
