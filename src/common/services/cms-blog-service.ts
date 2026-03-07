import { cmsApiClient } from '@/src/common/config/api';
import type {
  Blog,
  CreateBlogDto,
  UpdateBlogDto,
} from '@/src/common/@types/@cms-blog';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * CMS Blog Service
 * Encapsulates all blog-related API calls for the CMS system
 */

/**
 * Fetch all blogs for the authenticated tenant
 * @returns Promise<Blog[]> - List of all blogs
 */
export const fetchBlogs = async (): Promise<Blog[]> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get('cms/blogs');
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single blog by ID
 * @param blogId - The ID of the blog to retrieve
 * @returns Promise<Blog> - The blog data
 */
export const fetchBlogById = async (blogId: number): Promise<Blog> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/blogs/${blogId}`);
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new blog
 * @param data - Blog creation data (name and optional description)
 * @returns Promise<Blog> - The created blog with generated slug and secret_key
 */
export const createBlog = async (data: CreateBlogDto): Promise<Blog> => {
  try {
    const response = await cmsApiClient.post('cms/blogs', data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing blog
 * @param blogId - The ID of the blog to update
 * @param data - Blog update data (name and/or description)
 * @returns Promise<Blog> - The updated blog data
 */
export const updateBlog = async (
  blogId: number,
  data: UpdateBlogDto
): Promise<Blog> => {
  try {
    const response = await cmsApiClient.put(`cms/blogs/${blogId}`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete a blog
 * Cascades to delete all associated articles and images
 * @param blogId - The ID of the blog to delete
 * @returns Promise<void>
 */
export const deleteBlog = async (blogId: number): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/blogs/${blogId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Regenerate the secret key for a blog
 * Immediately invalidates the previous secret key
 * @param blogId - The ID of the blog
 * @returns Promise<Blog> - The blog data with the new secret_key
 */
export const regenerateBlogSecretKey = async (blogId: number): Promise<Blog> => {
  try {
    const response = await cmsApiClient.post(`cms/blogs/${blogId}/regenerate-key`);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};
