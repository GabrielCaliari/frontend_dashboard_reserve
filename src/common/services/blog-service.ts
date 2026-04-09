import api from "@/src/common/config/api";
import type {
  Blog,
  BlogCreateInput,
  BlogUpdateInput,
  BlogListResponse,
  BlogSecretKeyResponse,
} from "@/src/common/@types/@blog";

export const blogService = {
  // List all blogs (tenant_id via header x-tenant-id)
  async listBlogs(page?: number, limit?: number): Promise<BlogListResponse> {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;

    console.log("Fetching blogs with params:", params);
    const response = await api.get("/cms/blogs", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    console.log("Blogs response:", response.data);

    // Se a resposta já tem a estrutura correta, retorna direto
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }

    // Se a resposta é um array direto, normaliza para o formato esperado
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          page: page || 1,
          limit: limit || 10,
          total: response.data.length,
          total_pages: 1,
        },
      };
    }

    // Fallback: retorna estrutura vazia
    return {
      data: [],
      meta: {
        page: page || 1,
        limit: limit || 10,
        total: 0,
        total_pages: 0,
      },
    };
  },

  // Get single blog by deriving from list (GET /api/cms/blogs/:blogId does not exist)
  async getBlog(blogId: number): Promise<Blog> {
    const listResponse = await this.listBlogs(1, 200);
    const blog = listResponse.data.find((b) => b.id === blogId);
    if (!blog) throw new Error(`Blog not found: ${blogId}`);
    return blog;
  },

  // Create blog
  async createBlog(data: BlogCreateInput): Promise<Blog> {
    const response = await api.post("/cms/blogs", data);
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
