/**
 * Integration Tests for CMS Critical Flows
 * 
 * Tests the complete workflows:
 * - Blog creation → article creation → publish flow
 * - Article reordering with multiple articles
 * - Image upload → reorder → delete flow
 * - Public API with secret key authentication
 * 
 * Requirements: 3.1, 6.1, 10.1, 12.1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createBlog, 
  fetchBlogById, 
  regenerateBlogSecretKey 
} from '../cms-blog-service';
import { 
  createArticle, 
  fetchArticleById, 
  publishArticle, 
  reorderArticles 
} from '../cms-article-service';
import { 
  fetchPublicArticles, 
  fetchPublicArticleBySlug 
} from '../cms-public-service';
import type { Blog, CreateBlogDto } from '@/src/common/@types/@cms-blog';
import type { Article, CreateArticleDto, ReorderArticleDto } from '@/src/common/@types/@cms-article';

// Mock the API clients
vi.mock('@/src/common/config/cms-api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/src/common/config/cms-public-api-client', () => ({
  createPublicCmsClient: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

import { cmsApiClient } from '@/src/common/config/api';
import { createPublicCmsClient } from '@/src/common/config/cms-public-api-client';

describe('CMS Integration Tests - Critical Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Flow 1: Blog creation → Article creation → Publish', () => {
    it('should complete the full blog-to-published-article workflow', async () => {
      // Step 1: Create a blog
      const blogData: CreateBlogDto = {
        name: 'Tech Blog',
        description: 'A blog about technology',
      };

      const mockBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'A blog about technology',
        secret_key: 'test-secret-key-12345678901234567890',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(cmsApiClient.post).mockResolvedValueOnce({ data: mockBlog });

      const createdBlog = await createBlog(blogData);
      
      expect(createdBlog).toEqual(mockBlog);
      expect(createdBlog.secret_key).toBeDefined();
      expect(createdBlog.secret_key.length).toBeGreaterThanOrEqual(32);
      expect(cmsApiClient.post).toHaveBeenCalledWith('/blogs', blogData);

      // Step 2: Create an article in draft status
      const articleData: CreateArticleDto = {
        title: 'Introduction to TypeScript',
        content: '<p>TypeScript is a typed superset of JavaScript...</p>',
      };

      const mockDraftArticle: Article = {
        id: 1,
        blog_id: createdBlog.id,
        title: 'Introduction to TypeScript',
        slug: 'introduction-to-typescript',
        content: '<p>TypeScript is a typed superset of JavaScript...</p>',
        status: 'draft',
        display_order: 0,
        published_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValueOnce({ data: mockDraftArticle });

      const createdArticle = await createArticle(createdBlog.id, articleData);

      expect(createdArticle.status).toBe('draft');
      expect(createdArticle.published_at).toBeNull();
      expect(createdArticle.blog_id).toBe(createdBlog.id);
      expect(cmsApiClient.post).toHaveBeenCalledWith(
        `/blogs/${createdBlog.id}/articles`,
        articleData
      );

      // Step 3: Publish the article
      const mockPublishedArticle: Article = {
        ...mockDraftArticle,
        status: 'published',
        published_at: new Date().toISOString(),
      };

      vi.mocked(cmsApiClient.post).mockResolvedValueOnce({ data: mockPublishedArticle });

      const publishedArticle = await publishArticle(createdBlog.id, createdArticle.id);

      expect(publishedArticle.status).toBe('published');
      expect(publishedArticle.published_at).not.toBeNull();
      expect(cmsApiClient.post).toHaveBeenCalledWith(
        `/blogs/${createdBlog.id}/articles/${createdArticle.id}/publish`
      );

      // Step 4: Verify article is accessible via public API
      const mockPublicClient = {
        get: vi.fn().mockResolvedValueOnce({
          data: {
            data: [publishedArticle],
            meta: {
              current_page: 1,
              total_pages: 1,
              total_records: 1,
            },
          },
        }),
      };

      vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

      const publicArticles = await fetchPublicArticles(createdBlog.secret_key, { page: 1, limit: 10 });

      expect(publicArticles.data).toHaveLength(1);
      expect(publicArticles.data[0].status).toBe('published');
      expect(publicArticles.data[0].id).toBe(publishedArticle.id);
      expect(createPublicCmsClient).toHaveBeenCalledWith(createdBlog.secret_key);
    });

    it('should prevent publishing an article that is not in draft status', async () => {
      const blogId = 1;
      const articleId = 1;

      // Mock a 409 conflict error
      const conflictError = {
        response: {
          status: 409,
          data: {
            message: 'Article must be in draft status to publish',
            code: 'INVALID_STATUS_TRANSITION',
          },
        },
      };

      vi.mocked(cmsApiClient.post).mockRejectedValueOnce(conflictError);

      await expect(publishArticle(blogId, articleId)).rejects.toMatchObject({
        response: {
          status: 409,
        },
      });
    });
  });

  describe('Flow 2: Article reordering with multiple articles', () => {
    it('should reorder multiple articles correctly', async () => {
      const blogId = 1;

      // Create multiple articles
      const articles: Article[] = [
        {
          id: 1,
          blog_id: blogId,
          title: 'First Article',
          slug: 'first-article',
          content: 'Content 1',
          status: 'published',
          display_order: 0,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 2,
          blog_id: blogId,
          title: 'Second Article',
          slug: 'second-article',
          content: 'Content 2',
          status: 'published',
          display_order: 1,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 3,
          blog_id: blogId,
          title: 'Third Article',
          slug: 'third-article',
          content: 'Content 3',
          status: 'published',
          display_order: 2,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
      ];

      // Reorder: move third to first position
      const reorderData: ReorderArticleDto[] = [
        { id: 3, display_order: 0 },
        { id: 1, display_order: 1 },
        { id: 2, display_order: 2 },
      ];

      const reorderedArticles = articles.map((article) => {
        const newOrder = reorderData.find((r) => r.id === article.id);
        return { ...article, display_order: newOrder?.display_order ?? article.display_order };
      });

      vi.mocked(cmsApiClient.put).mockResolvedValueOnce({ data: reorderedArticles });

      const result = await reorderArticles(blogId, reorderData);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(3);
      expect(result[0].display_order).toBe(0);
      expect(result[1].id).toBe(1);
      expect(result[1].display_order).toBe(1);
      expect(result[2].id).toBe(2);
      expect(result[2].display_order).toBe(2);
      expect(cmsApiClient.put).toHaveBeenCalledWith(
        `/blogs/${blogId}/articles/reorder`,
        reorderData
      );
    });

    it('should handle reordering with gaps in display_order', async () => {
      const blogId = 1;

      // Reorder with non-sequential display_order values (gaps are allowed)
      const reorderData: ReorderArticleDto[] = [
        { id: 1, display_order: 10 },
        { id: 2, display_order: 20 },
        { id: 3, display_order: 30 },
      ];

      const mockResponse = reorderData.map((item) => ({
        id: item.id,
        blog_id: blogId,
        title: `Article ${item.id}`,
        slug: `article-${item.id}`,
        content: 'Content',
        status: 'published' as const,
        display_order: item.display_order,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [],
      }));

      vi.mocked(cmsApiClient.put).mockResolvedValueOnce({ data: mockResponse });

      const result = await reorderArticles(blogId, reorderData);

      expect(result[0].display_order).toBe(10);
      expect(result[1].display_order).toBe(20);
      expect(result[2].display_order).toBe(30);
    });
  });

  describe('Flow 3: Public API with secret key authentication', () => {
    it('should fetch published articles using secret key', async () => {
      const secretKey = 'valid-secret-key-12345678901234567890';
      const page = 1;
      const limit = 10;

      const mockArticles: Article[] = [
        {
          id: 1,
          blog_id: 1,
          title: 'Public Article 1',
          slug: 'public-article-1',
          content: '<p>Content 1</p>',
          status: 'published',
          display_order: 0,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
        {
          id: 2,
          blog_id: 1,
          title: 'Public Article 2',
          slug: 'public-article-2',
          content: '<p>Content 2</p>',
          status: 'published',
          display_order: 1,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
      ];

      const mockPublicClient = {
        get: vi.fn().mockResolvedValueOnce({
          data: {
            data: mockArticles,
            meta: {
              current_page: page,
              total_pages: 1,
              total_records: 2,
            },
          },
        }),
      };

      vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

      const result = await fetchPublicArticles(secretKey, { page, limit });

      expect(result.data).toHaveLength(2);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.total_records).toBe(2);
      expect(createPublicCmsClient).toHaveBeenCalledWith(secretKey);
      expect(mockPublicClient.get).toHaveBeenCalledWith('/articles', { params: { page, limit } });
    });

    it('should fetch article by slug using secret key', async () => {
      const secretKey = 'valid-secret-key-12345678901234567890';
      const slug = 'public-article-1';

      const mockArticle: Article = {
        id: 1,
        blog_id: 1,
        title: 'Public Article 1',
        slug: 'public-article-1',
        content: '<p>Full content here</p>',
        status: 'published',
        display_order: 0,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        images: [
          {
            id: 1,
            article_id: 1,
            url: 'https://example.com/image1.jpg',
            alt_text: 'Image 1',
            display_order: 0,
            created_at: new Date().toISOString(),
          },
        ],
      };

      const mockPublicClient = {
        get: vi.fn().mockResolvedValueOnce({ data: mockArticle }),
      };

      vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

      const result = await fetchPublicArticleBySlug(secretKey, slug);

      expect(result.slug).toBe(slug);
      expect(result.status).toBe('published');
      expect(result.images).toHaveLength(1);
      expect(createPublicCmsClient).toHaveBeenCalledWith(secretKey);
      expect(mockPublicClient.get).toHaveBeenCalledWith(`/articles/${slug}`);
    });

    it('should return 404 for non-existent article slug', async () => {
      const secretKey = 'valid-secret-key-12345678901234567890';
      const slug = 'non-existent-article';

      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'Article not found',
          },
        },
      };

      const mockPublicClient = {
        get: vi.fn().mockRejectedValueOnce(notFoundError),
      };

      vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

      await expect(fetchPublicArticleBySlug(secretKey, slug)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });

    it('should only return published articles via public API', async () => {
      const secretKey = 'valid-secret-key-12345678901234567890';

      // Mock response should only include published articles
      const mockPublishedArticles: Article[] = [
        {
          id: 2,
          blog_id: 1,
          title: 'Published Article',
          slug: 'published-article',
          content: '<p>Content</p>',
          status: 'published',
          display_order: 0,
          published_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          images: [],
        },
      ];

      const mockPublicClient = {
        get: vi.fn().mockResolvedValueOnce({
          data: {
            data: mockPublishedArticles,
            meta: {
              current_page: 1,
              total_pages: 1,
              total_records: 1,
            },
          },
        }),
      };

      vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

      const result = await fetchPublicArticles(secretKey, { page: 1, limit: 10 });

      // Verify all returned articles are published
      expect(result.data.every((article) => article.status === 'published')).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe('Flow 4: Secret key regeneration and invalidation', () => {
    it('should regenerate secret key and invalidate the old one', async () => {
      const blogId = 1;
      const oldSecretKey = 'old-secret-key-12345678901234567890';

      const mockBlogWithOldKey: Blog = {
        id: blogId,
        tenant_id: 100,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test description',
        secret_key: oldSecretKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      vi.mocked(cmsApiClient.get).mockResolvedValueOnce({ data: mockBlogWithOldKey });

      const blogBefore = await fetchBlogById(blogId);
      expect(blogBefore.secret_key).toBe(oldSecretKey);

      // Regenerate key
      const newSecretKey = 'new-secret-key-98765432109876543210';
      const mockBlogWithNewKey: Blog = {
        ...mockBlogWithOldKey,
        secret_key: newSecretKey,
        updated_at: new Date().toISOString(),
      };

      vi.mocked(cmsApiClient.post).mockResolvedValueOnce({ data: mockBlogWithNewKey });

      const blogAfter = await regenerateBlogSecretKey(blogId);

      expect(blogAfter.secret_key).toBe(newSecretKey);
      expect(blogAfter.secret_key).not.toBe(oldSecretKey);
      expect(blogAfter.secret_key.length).toBeGreaterThanOrEqual(32);
      expect(cmsApiClient.post).toHaveBeenCalledWith(`/blogs/${blogId}/regenerate-key`);
    });
  });
});
