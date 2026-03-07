import { cmsApiClient } from '@/src/common/config/api';
import { Author } from '@/src/common/@types/@cms-author';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * Fetch all authors for the current tenant (AUTHENTICATED)
 * @returns Promise<Author[]>
 */
export const fetchAuthors = async (): Promise<Author[]> => {
  try {
    return await withRetry(async () => {
      // Use authenticated endpoint: GET /api/cms/authors
      const response = await cmsApiClient.get('cms/authors');
      
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
 * Fetch a single author by ID (AUTHENTICATED)
 * @param authorId - The author ID
 * @returns Promise<Author>
 */
export const fetchAuthorById = async (authorId: string): Promise<Author> => {
  try {
    return await withRetry(async () => {
      // Use authenticated endpoint: GET /api/cms/authors/{id}
      const response = await cmsApiClient.get(`cms/authors/${authorId}`);
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new author (AUTHENTICATED)
 * @param data - Author creation data
 * @returns Promise<Author>
 */
export const createAuthor = async (
  data: Omit<Author, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<Author> => {
  try {
    // Use authenticated endpoint: POST /api/cms/authors
    const response = await cmsApiClient.post('cms/authors', data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing author (AUTHENTICATED)
 * @param authorId - The author ID
 * @param data - Author update data
 * @returns Promise<Author>
 */
export const updateAuthor = async (
  authorId: string,
  data: Partial<Omit<Author, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>>
): Promise<Author> => {
  try {
    // Use authenticated endpoint: PUT /api/cms/authors/{id}
    const response = await cmsApiClient.put(`cms/authors/${authorId}`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an author (AUTHENTICATED)
 * @param authorId - The author ID
 * @returns Promise<void>
 */
export const deleteAuthor = async (authorId: string): Promise<void> => {
  try {
    // Use authenticated endpoint: DELETE /api/cms/authors/{id}
    await cmsApiClient.delete(`cms/authors/${authorId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};
