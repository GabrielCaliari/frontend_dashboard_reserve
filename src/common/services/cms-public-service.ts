import { createPublicCmsClient } from "@/src/infraestructure/axios/cms-public-api-client";
import { Article } from "@/src/shared/domain/types/@cms-article";
import {
  withRetry,
  transformCMSError,
} from "@/src/shared/utils/cms-error-handler";

interface PublicArticleApiResponse {
  id: string | number;
  blog_id: string | number;
  title?: string;
  displayTitle?: string;
  display_title?: string;
  slug: string;
  content: string;
  metaTitle?: string | null;
  meta_title?: string | null;
  metaDescription?: string | null;
  meta_description?: string | null;
  focusKeyword?: string | null;
  focus_keyword?: string | null;
  authorId?: string | number | null;
  author_id?: string | number | null;
  coverImageId?: string | number | null;
  cover_image_id?: string | number | null;
  coverImage?: Article["coverImage"];
  cover_image?: Article["coverImage"];
  language?: string | null;
  status: Article["status"];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images?: Article["images"];
}

const normalizeLanguage = (language?: string | null): string => {
  const normalized = language?.trim().toLowerCase();
  return normalized && /^[a-z]{2}_[a-z]{2}$/.test(normalized)
    ? normalized
    : "en_us";
};

const normalizePublicArticle = (
  article: PublicArticleApiResponse,
): Article => ({
  id: String(article.id),
  blog_id: String(article.blog_id),
  title: article.title ?? article.displayTitle ?? article.display_title ?? "",
  displayTitle:
    article.displayTitle ?? article.display_title ?? article.title ?? "",
  slug: article.slug,
  content: article.content,
  metaTitle: article.metaTitle ?? article.meta_title ?? undefined,
  metaDescription:
    article.metaDescription ?? article.meta_description ?? undefined,
  focusKeyword: article.focusKeyword ?? article.focus_keyword ?? undefined,
  authorId:
    article.authorId != null
      ? String(article.authorId)
      : article.author_id != null
        ? String(article.author_id)
        : undefined,
  coverImageId:
    article.coverImageId != null
      ? String(article.coverImageId)
      : article.cover_image_id != null
        ? String(article.cover_image_id)
        : undefined,
  coverImage: article.coverImage ?? article.cover_image ?? null,
  language: normalizeLanguage(article.language),
  status: article.status,
  published_at: article.published_at,
  created_at: article.created_at,
  updated_at: article.updated_at,
  images: article.images ?? [],
});

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
 * Only returns articles with status "published", ordered by published_at desc.
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
  params: PublicArticlesParams = {},
): Promise<PublicArticlesResponse> => {
  try {
    return await withRetry(async () => {
      const client = createPublicCmsClient(secretKey);

      // Apply defaults: page=1, limit=10
      const queryParams = {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
      };

      const response = await client.get<PublicArticlesResponse>("/articles", {
        params: queryParams,
      });

      return {
        ...response.data,
        data: [...(response.data.data as PublicArticleApiResponse[])]
          .map(normalizePublicArticle)
          .sort((left, right) => {
            const leftDate = new Date(
              left.published_at ?? left.updated_at,
            ).getTime();
            const rightDate = new Date(
              right.published_at ?? right.updated_at,
            ).getTime();
            return rightDate - leftDate;
          }),
      };
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
  slug: string,
): Promise<Article> => {
  try {
    return await withRetry(async () => {
      const client = createPublicCmsClient(secretKey);

      const response = await client.get<PublicArticleApiResponse>(
        `/articles/${slug}`,
      );

      return normalizePublicArticle(response.data);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};
