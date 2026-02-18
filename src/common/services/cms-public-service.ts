import { createPublicCmsClient } from '@/src/common/config/cms-public-api-client';
import { Article } from '@/src/common/@types/@cms-article';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * Parameters for fetching public articles with pagination
 */
export interface PublicArticlesParams {
  page?: number;
  limit?: number;
}

/**
 * Response structure for paginated public articles
 */
export interface PublicArticlesResponse {
  data: Article[];
  meta: {
    current_page: number;
    total_pages: number;
    total_records: number;
  };
}

/**
 * Fetch paginated list of published articles from a blog using its secret key.
 * Only returns articles with status "published", ordered by display_order.
 * 
 * @param secretKey - Blog secret key for authentication
 * @param params - Pagination parameters (page, limit)
 * @returns Promise resolving to paginated articles with metadata
 * 
 * @example
 * const result = await fetchPublicArticles('secret-key', { page: 1, limit: 10 });
 * console.log(result.data); // Array of published articles
 * console.log(result.meta); // Pagination metadata
 * 
 * @throws {CMSError} When API request fails or authentication is invalid
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export const fetchPublicArticles = async (
  secretKey: string,
  params: PublicArticlesParams = {}
): Promise<PublicArticlesResponse> => {
  try {
    return await withRetry(async () => {
      const client = createPublicCmsClient(secretKey);
      
      // Apply defaults: page=1, limit=10
      const queryParams = {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      };
      
      const response = await client.get<PublicArticlesResponse>('/articles', {
        params: queryParams,
      });
      
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single published article by its slug using blog secret key.
 * Only returns the article if it exists, is published, and belongs to the blog.
 * 
 * @param secretKey - Blog secret key for authentication
 * @param slug - URL-friendly article identifier
 * @returns Promise resolving to the article with all images
 * 
 * @example
 * const article = await fetchPublicArticleBySlug('secret-key', 'my-article-slug');
 * console.log(article.title);
 * console.log(article.images); // Array of article images
 * 
 * @throws {CMSError} When article not found (404) or not published
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */
export const fetchPublicArticleBySlug = async (
  secretKey: string,
  slug: string
): Promise<Article> => {
  try {
    return await withRetry(async () => {
      const client = createPublicCmsClient(secretKey);
      
      const response = await client.get<Article>(`/articles/${slug}`);
      
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};
