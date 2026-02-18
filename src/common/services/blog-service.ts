import api from '@/src/common/config/api';
import type {
  Blog,
  BlogCreateInput,
  BlogUpdateInput,
  BlogListResponse,
  BlogSecretKeyResponse,
} from '@/src/common/@types/@blog';

export const blogService = {
  // List all blogs (tenant_id via header x-tenant-id)
  async listBlogs(page = 1, limit = 10): Promise<BlogListResponse> {
    const response = await api.get('/cms/blogs', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get single blog
  async getBlog(blogId: number): Promise<Blog> {
    const response = await api.get(`/cms/blogs/${blogId}`);
    return response.data;
  },

  // Create blog
  async createBlog(data: BlogCreateInput): Promise<Blog> {
    const response = await api.post('/cms/blogs', data);
    return response.data;
  },

  // Update blog
  async updateBlog(blogId: number, data: BlogUpdateInput): Promise<Blog> {
    const response = await api.put(`/cms/blogs/${blogId}`, data);
    return response.data;
  },

  // Delete blog
  async deleteBlog(blogId: number): Promise<void> {
    await api.delete(`/cms/blogs/${blogId}`);
  },

  // Regenerate secret key
  async regenerateSecretKey(blogId: number): Promise<BlogSecretKeyResponse> {
    const response = await api.post(`/cms/blogs/${blogId}/regenerate-key`);
    return response.data;
  },
};
