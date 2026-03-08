import { cmsApiClient } from '@/src/common/config/api';
import {
  Article,
  ArticleStatus,
  CreateArticleDto,
  UpdateArticleDto,
  ReorderArticleDto,
} from '@/src/common/@types/@cms-article';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

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
      const params: Record<string, any> = { page, limit };
      if (blogId) params.blogId = blogId;
      if (status) params.status = status;
      
      // Use authenticated endpoint: /api/cms/articles?blogId={blogId}
      const response = await cmsApiClient.get('cms/articles', { params });
      
      // Handle paginated response format
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Fallback for direct array response
      if (Array.isArray(response.data)) {
        return response.data;
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
      // Use authenticated endpoint: /api/cms/articles/{id}
      const response = await cmsApiClient.get(`cms/articles/${articleId}`);
      return response.data;
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
    const payload = { 
      ...data,
      authorId: String(data.authorId)
    };
    
    // Use authenticated endpoint: POST /api/cms/articles
    const response = await cmsApiClient.post('cms/articles', payload);
    return response.data;
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
    // Use authenticated endpoint: PUT /api/cms/articles/{id}
    const response = await cmsApiClient.put(`cms/articles/${articleId}`, data);
    return response.data;
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
    // Use authenticated endpoint: DELETE /api/cms/articles/{id}
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
    // Use authenticated endpoint: POST /api/cms/articles/{id}/publish
    const response = await cmsApiClient.post(`cms/articles/${articleId}/publish`);
    return response.data;
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
  articleId: number
): Promise<Article> => {
  try {
    // Use authenticated endpoint: POST /api/cms/articles/{id}/archive
    const response = await cmsApiClient.post(`cms/articles/${articleId}/archive`);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Reorder articles by updating display_order values (AUTHENTICATED)
 * @param blogId - The blog ID
 * @param order - Array of article IDs with new display_order values
 * @returns Promise<void>
 */
export const reorderArticles = async (
  blogId: string | number,
  order: ReorderArticleDto[]
): Promise<void> => {
  try {
    // Use authenticated endpoint: PUT /api/cms/articles/reorder
    await cmsApiClient.put('cms/articles/reorder', { blogId, order });
  } catch (error) {
    throw transformCMSError(error);
  }
};
