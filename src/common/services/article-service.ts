import api from '@/src/common/config/api';
import axios from 'axios';
import { buildApiBaseUrl } from '@/src/common/config/build-api-base-url';
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
    const response = await api.get('/cms/articles', {
      params: { blogId, page, limit },
    });
    return response.data;
  },

  async getArticle(blogId: number, articleId: number): Promise<Article> {
    const response = await api.get(`/cms/articles/${articleId}`, { params: { blogId } });
    return response.data;
  },

  async createArticle(blogId: number, data: ArticleCreateInput): Promise<Article> {
    const payload = { ...data, blogId };
    const response = await api.post('/cms/articles', payload);
    return response.data;
  },

  async updateArticle(
    blogId: number,
    articleId: number,
    data: ArticleUpdateInput
  ): Promise<Article> {
    const payload = { ...data, blogId };
    const response = await api.put(`/cms/articles/${articleId}`, payload);
    return response.data;
  },

  async deleteArticle(blogId: number, articleId: number): Promise<void> {
    await api.delete(`/cms/articles/${articleId}`, { params: { blogId } });
  },

  // Public API endpoints (require secret key)
  async listPublicArticles(
    secretKey: string,
    params?: PublicArticleListParams
  ): Promise<PublicArticleListResponse> {
    const response = await axios.get(
      `${buildApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, 'api/cms/public')}/articles`,
      {
      headers: {
        'x-blog-secret-key': secretKey,
      },
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
      },
      },
    );
    return response.data;
  },

  async getPublicArticleBySlug(secretKey: string, slug: string): Promise<PublicArticle> {
    const response = await axios.get(
      `${buildApiBaseUrl(process.env.NEXT_PUBLIC_API_URL, 'api/cms/public')}/articles/${slug}`,
      {
        headers: {
          'x-blog-secret-key': secretKey,
        },
      },
    );
    return response.data;
  },
};
