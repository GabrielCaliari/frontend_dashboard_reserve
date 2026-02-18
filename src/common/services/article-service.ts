import api from '@/src/common/config/api';
import axios from 'axios';
import type {
  Article,
  ArticleCreateInput,
  ArticleUpdateInput,
  ArticleListResponse,
  PublicArticleListParams,
  PublicArticleListResponse,
  PublicArticle,
} from '@/src/common/@types/@article';

export const articleService = {
  // Admin endpoints (tenant_id via header x-tenant-id)
  async listArticles(blogId: number, page = 1, limit = 10): Promise<ArticleListResponse> {
    const response = await api.get(`/cms/blogs/${blogId}/articles`, {
      params: { page, limit },
    });
    return response.data;
  },

  async getArticle(blogId: number, articleId: number): Promise<Article> {
    const response = await api.get(`/cms/blogs/${blogId}/articles/${articleId}`);
    return response.data;
  },

  async createArticle(blogId: number, data: ArticleCreateInput): Promise<Article> {
    const response = await api.post(`/cms/blogs/${blogId}/articles`, data);
    return response.data;
  },

  async updateArticle(
    blogId: number,
    articleId: number,
    data: ArticleUpdateInput
  ): Promise<Article> {
    const response = await api.put(`/cms/blogs/${blogId}/articles/${articleId}`, data);
    return response.data;
  },

  async deleteArticle(blogId: number, articleId: number): Promise<void> {
    await api.delete(`/cms/blogs/${blogId}/articles/${articleId}`);
  },

  // Public API endpoints (require secret key)
  async listPublicArticles(
    secretKey: string,
    params?: PublicArticleListParams
  ): Promise<PublicArticleListResponse> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await axios.get(`${API_URL}/cms/api/cms/public/articles`, {
      headers: {
        'x-blog-secret-key': secretKey,
      },
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
    });
    return response.data;
  },

  async getPublicArticleBySlug(secretKey: string, slug: string): Promise<PublicArticle> {
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const response = await axios.get(`${API_URL}/cms/api/cms/public/articles/${slug}`, {
      headers: {
        'x-blog-secret-key': secretKey,
      },
    });
    return response.data;
  },
};
