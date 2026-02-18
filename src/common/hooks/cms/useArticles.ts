import { useQuery } from '@tanstack/react-query';
import { articleService } from '@/src/common/services/article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import type { ArticleStatus } from '@/src/common/@types/@article';

/**
 * Query key constants for article-related queries
 * Used for cache management and invalidation
 * 
 * Structure:
 * - all: Base key for all articles in a blog
 * - filtered: Key for filtered article lists (by status)
 * - detail: Key for single article
 */
export const ARTICLE_QUERY_KEYS = {
  all: (tenantId: number | null, blogId: number) => 
    ['cms', 'blogs', tenantId, blogId, 'articles'] as const,
  filtered: (tenantId: number | null, blogId: number, status?: ArticleStatus) => 
    ['cms', 'blogs', tenantId, blogId, 'articles', { status }] as const,
  detail: (tenantId: number | null, blogId: number, articleId: number) => 
    ['cms', 'blogs', tenantId, blogId, 'articles', articleId] as const,
} as const;

/**
 * Hook to fetch articles for a blog with optional status filtering
 * 
 * Features:
 * - Automatic tenant ID integration from store
 * - 2-minute cache (staleTime) for admin content
 * - Optional status filtering (draft, published, archived)
 * - Only enabled when both tenant ID and blog ID are available
 * - Pagination support via page and limit parameters
 * 
 * @param blogId - The ID of the blog to fetch articles from
 * @param status - Optional status filter (draft, published, archived)
 * @param page - Page number for pagination (default: 1)
 * @param limit - Items per page (default: 10)
 * @returns Query result with articles data, loading state, and error
 * 
 * @example
 * ```tsx
 * // Fetch all articles
 * const { data, isLoading } = useArticles(123);
 * 
 * // Fetch only published articles
 * const { data, isLoading } = useArticles(123, 'published');
 * 
 * // Fetch with pagination
 * const { data, isLoading } = useArticles(123, undefined, 2, 20);
 * ```
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
 */
export function useArticles(
  blogId: number,
  status?: ArticleStatus,
  page: number = 1,
  limit: number = 10
) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ARTICLE_QUERY_KEYS.filtered(tenantId, blogId, status),
    queryFn: async () => {
      const response = await articleService.listArticles(blogId, page, limit);
      
      // Apply status filter on client side if provided
      // Note: Ideally this should be done server-side, but we filter here for now
      if (status) {
        return {
          ...response,
          data: response.data.filter(article => article.status === status),
        };
      }
      
      return response;
    },
    enabled: !!blogId && !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin content
  });
}

/**
 * Hook to fetch a single article by ID
 * 
 * Features:
 * - Automatic tenant ID integration from store
 * - 2-minute cache (staleTime) for admin content
 * - Only enabled when tenant ID, blog ID, and article ID are all available
 * - Includes all associated images ordered by display_order
 * 
 * @param blogId - The ID of the blog the article belongs to
 * @param articleId - The ID of the article to fetch
 * @returns Query result with article data, loading state, and error
 * 
 * @example
 * ```tsx
 * const { data: article, isLoading, error } = useArticle(123, 456);
 * 
 * if (article) {
 *   console.log(article.title);
 *   console.log(article.images); // Array of ArticleImage
 * }
 * ```
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3, 15.4**
 */
export function useArticle(blogId: number, articleId: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
    queryFn: () => articleService.getArticle(blogId, articleId),
    enabled: !!blogId && !!articleId && !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes for admin content
  });
}
