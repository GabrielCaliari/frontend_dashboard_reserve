import cmsApiClient from '@/src/common/config/cms-api-client';
import {
  Article,
  ArticleStatus,
  CreateArticleDto,
  UpdateArticleDto,
  ReorderArticleDto,
} from '@/common/@types/@cms-article';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * Fetch articles for a specific blog with optional status filter
 * @param blogId - The blog ID
 * @param status - Optional status filter (draft, published, archived)
 * @returns Promise<Article[]>
 */
export const fetchArticles = async (
  blogId: number,
  status?: ArticleStatus
): Promise<Article[]> => {
  try {
    return await withRetry(async () => {
      const params = status ? { status } : {};
      const response = await cmsApiClient.get(`blogs/${blogId}/articles`, { params });
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single article by ID
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const fetchArticleById = async (
  blogId: number,
  articleId: number
): Promise<Article> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`blogs/${blogId}/articles/${articleId}`);
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new article
 * @param blogId - The blog ID
 * @param data - Article creation data
 * @returns Promise<Article>
 */
export const createArticle = async (
  blogId: number,
  data: CreateArticleDto
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`blogs/${blogId}/articles`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing article
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @param data - Article update data
 * @returns Promise<Article>
 */
export const updateArticle = async (
  blogId: number,
  articleId: number,
  data: UpdateArticleDto
): Promise<Article> => {
  try {
    const response = await cmsApiClient.put(`blogs/${blogId}/articles/${articleId}`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an article
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @returns Promise<void>
 */
export const deleteArticle = async (
  blogId: number,
  articleId: number
): Promise<void> => {
  try {
    await cmsApiClient.delete(`blogs/${blogId}/articles/${articleId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Publish an article (transition from draft to published)
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const publishArticle = async (
  blogId: number,
  articleId: number
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`blogs/${blogId}/articles/${articleId}/publish`);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Archive an article (transition from published to archived)
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @returns Promise<Article>
 */
export const archiveArticle = async (
  blogId: number,
  articleId: number
): Promise<Article> => {
  try {
    const response = await cmsApiClient.post(`blogs/${blogId}/articles/${articleId}/archive`);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Reorder articles by updating display_order values
 * @param blogId - The blog ID
 * @param order - Array of article IDs with new display_order values
 * @returns Promise<void>
 */
export const reorderArticles = async (
  blogId: number,
  order: ReorderArticleDto[]
): Promise<void> => {
  try {
    await cmsApiClient.put(`blogs/${blogId}/articles/reorder`, { order });
  } catch (error) {
    throw transformCMSError(error);
  }
};
