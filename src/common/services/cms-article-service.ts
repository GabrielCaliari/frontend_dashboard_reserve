import { cmsApiClient } from '@/src/common/config/api';
import {
  Article,
  ArticleStatus,
  CreateArticleDto,
  UpdateArticleDto,
  ArticleCoverImage,
} from '@/src/common/@types/@cms-article';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

interface ArticleApiResponse {
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
  coverImage?: ArticleCoverImage | null;
  cover_image?: ArticleCoverImage | null;
  language?: string | null;
  status: ArticleStatus;
  published_at: string | null;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
  images?: Article['images'];
}

const defaultLanguage = 'en_us';

const normalizeLanguage = (language?: string | null): string => {
  const normalized = language?.trim().toLowerCase();
  return normalized && /^[a-z]{2}_[a-z]{2}$/.test(normalized)
    ? normalized
    : defaultLanguage;
};

const normalizeCoverImage = (
  coverImage?: ArticleCoverImage | null,
): ArticleCoverImage | null => {
  if (!coverImage) {
    return null;
  }

  return {
    id: String(coverImage.id),
    url: coverImage.url,
    alt_text: coverImage.alt_text ?? null,
  };
};

const normalizeArticle = (article: ArticleApiResponse): Article => ({
  id: String(article.id),
  blog_id: String(article.blog_id),
  title: article.title ?? article.displayTitle ?? article.display_title ?? '',
  displayTitle: article.displayTitle ?? article.display_title ?? article.title ?? '',
  slug: article.slug,
  content: article.content,
  metaTitle: article.metaTitle ?? article.meta_title ?? undefined,
  metaDescription: article.metaDescription ?? article.meta_description ?? undefined,
  focusKeyword: article.focusKeyword ?? article.focus_keyword ?? undefined,
  authorId: article.authorId != null
    ? String(article.authorId)
    : article.author_id != null
      ? String(article.author_id)
      : undefined,
  coverImageId: article.coverImageId != null
    ? String(article.coverImageId)
    : article.cover_image_id != null
      ? String(article.cover_image_id)
      : undefined,
  coverImage: normalizeCoverImage(article.coverImage ?? article.cover_image),
  language: normalizeLanguage(article.language),
  status: article.status,
  published_at: article.published_at,
  scheduled_at: article.scheduled_at ?? null,
  created_at: article.created_at,
  updated_at: article.updated_at,
  images: article.images ?? [],
});

const normalizeArticles = (articles: ArticleApiResponse[]): Article[] =>
  articles.map(normalizeArticle);

const serializeArticlePayload = (data: CreateArticleDto | UpdateArticleDto) => {
  const payload = {
    displayTitle: data.displayTitle,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    focusKeyword: data.focusKeyword,
    slug: data.slug,
    authorId: data.authorId,
    blogId: data.blogId,
    content: data.content,
    coverImageId: data.coverImageId,
    language: normalizeLanguage(data.language),
    ...('status' in data && data.status ? { status: data.status } : {}),
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  );
};

/**
 * Fetch articles for a specific blog with optional status filter (AUTHENTICATED)
 * @param blogId - The blog ID
 * @param status - Optional status filter (draft, published, archived)
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 30)
 * @returns Promise<Article[]>
 */
export const fetchArticles = async (
  blogId?: string | number,
  status?: ArticleStatus,
  page: number = 1,
  limit: number = 30
): Promise<Article[]> => {
  try {
    return await withRetry(async () => {
      const params: Record<string, string | number> = { page, limit };
      if (blogId) params.blogId = blogId;
      if (status) params.status = status;
      
      const response = await cmsApiClient.get('cms/articles', { params });
      
      if (response.data && Array.isArray(response.data.data)) {
        return normalizeArticles(response.data.data as ArticleApiResponse[]);
      }
      
      if (Array.isArray(response.data)) {
        return normalizeArticles(response.data as ArticleApiResponse[]);
      }
      
      return [];
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single article by ID (AUTHENTICATED)
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const fetchArticleById = async (
  articleId: string
): Promise<Article> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/articles/${articleId}`);
      return normalizeArticle(response.data as ArticleApiResponse);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new article (AUTHENTICATED)
 * @param data - Article creation data (must include blogId)
 * @returns Promise<Article>
 */
export const createArticle = async (
  data: CreateArticleDto
): Promise<Article> => {
  try {
    const payload = serializeArticlePayload({
      ...data,
      authorId: String(data.authorId),
    });

    const response = await cmsApiClient.post('cms/articles', payload);
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing article (AUTHENTICATED)
 * @param articleId - The article ID
 * @param data - Article update data
 * @returns Promise<Article>
 */
export const updateArticle = async (
  articleId: string,
  data: UpdateArticleDto
): Promise<Article> => {
  try {
    const response = await cmsApiClient.put(
      `cms/articles/${articleId}`,
      serializeArticlePayload(data),
    );
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an article (AUTHENTICATED)
 * @param articleId - The article ID
 * @returns Promise<void>
 */
export const deleteArticle = async (
  articleId: string
): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/articles/${articleId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Publish an article (transition from draft to published) (AUTHENTICATED)
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const publishArticle = async (
  articleId: string
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`cms/articles/${articleId}/publish`);
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Archive an article (transition from published to archived) (AUTHENTICATED)
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const archiveArticle = async (
  articleId: string
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`cms/articles/${articleId}/archive`);
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Unarchive an article (transition from archived to published) (AUTHENTICATED)
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const unarchiveArticle = async (
  articleId: string
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`cms/articles/${articleId}/unarchive`);
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Schedule an article for future publication (AUTHENTICATED)
 * @param articleId - The article ID
 * @param scheduledAt - ISO 8601 future datetime string
 * @returns Promise<Article>
 */
export const scheduleArticle = async (
  articleId: string,
  scheduledAt: string,
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`cms/articles/${articleId}/publish`, { scheduledAt });
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update the published_at date of a published or scheduled article (AUTHENTICATED)
 * @param articleId - The article ID
 * @param publishedAt - ISO 8601 datetime string (past = correct date; future = reschedule)
 * @returns Promise<Article>
 */
export const updatePublishedAt = async (
  articleId: string,
  publishedAt: string,
): Promise<Article> => {
  try {
    const response = await cmsApiClient.patch(`cms/articles/${articleId}/published-at`, { publishedAt });
    return normalizeArticle(response.data as ArticleApiResponse);
  } catch (error) {
    throw transformCMSError(error);
  }
};
