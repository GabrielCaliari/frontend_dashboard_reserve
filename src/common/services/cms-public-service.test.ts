import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPublicArticles,
  fetchPublicArticleBySlug,
  PublicArticlesResponse,
} from './cms-public-service';
import { createPublicCmsClient } from '@/src/common/config/cms-public-api-client';
import type { Article } from '@/src/common/@types/@cms-article';

// Mock the public API client factory
vi.mock('@/src/common/config/cms-public-api-client', () => ({
  createPublicCmsClient: vi.fn(),
}));

describe('CMS Public Service', () => {
  const mockSecretKey = 'test-secret-key-123';
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock axios client
    mockClient = {
      get: vi.fn(),
    };
    
    // Mock the factory to return our mock client
    vi.mocked(createPublicCmsClient).mockReturnValue(mockClient as any);
  });

  describe('fetchPublicArticles', () => {
    it('should fetch articles with default pagination (page=1, limit=10)', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [
          {
            id: 1,
            blog_id: 1,
            title: 'First Article',
            slug: 'first-article',
            content: '<p>Content here</p>',
            status: 'published',
            display_order: 1,
            published_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            images: [],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 1,
        },
      };


      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey);

      expect(createPublicCmsClient).toHaveBeenCalledWith(mockSecretKey);
      expect(mockClient.get).toHaveBeenCalledWith('/articles', {
        params: { page: 1, limit: 10 },
      });
      expect(result).toEqual(mockResponse);
      expect(result.meta.current_page).toBe(1);
    });

    it('should fetch articles with custom page parameter', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [
          {
            id: 11,
            blog_id: 1,
            title: 'Article on Page 2',
            slug: 'article-page-2',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 11,
            published_at: '2024-01-11T00:00:00Z',
            created_at: '2024-01-11T00:00:00Z',
            updated_at: '2024-01-11T00:00:00Z',
            images: [],
          },
        ],
        meta: {
          current_page: 2,
          total_pages: 5,
          total_records: 50,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey, { page: 2 });

      expect(mockClient.get).toHaveBeenCalledWith('/articles', {
        params: { page: 2, limit: 10 },
      });
      expect(result.meta.current_page).toBe(2);
    });

    it('should fetch articles with custom limit parameter', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          blog_id: 1,
          title: `Article ${i + 1}`,
          slug: `article-${i + 1}`,
          content: '<p>Content</p>',
          status: 'published' as const,
          display_order: i + 1,
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          images: [],
        })),
        meta: {
          current_page: 1,
          total_pages: 2,
          total_records: 50,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey, { limit: 25 });

      expect(mockClient.get).toHaveBeenCalledWith('/articles', {
        params: { page: 1, limit: 25 },
      });
      expect(result.data).toHaveLength(25);
    });

    it('should fetch articles with both custom page and limit', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: Array.from({ length: 5 }, (_, i) => ({
          id: i + 16,
          blog_id: 1,
          title: `Article ${i + 16}`,
          slug: `article-${i + 16}`,
          content: '<p>Content</p>',
          status: 'published' as const,
          display_order: i + 16,
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          images: [],
        })),
        meta: {
          current_page: 4,
          total_pages: 10,
          total_records: 50,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey, { page: 4, limit: 5 });

      expect(mockClient.get).toHaveBeenCalledWith('/articles', {
        params: { page: 4, limit: 5 },
      });
      expect(result.meta.current_page).toBe(4);
      expect(result.data).toHaveLength(5);
    });

    it('should return only published articles (filtered by backend)', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [
          {
            id: 1,
            blog_id: 1,
            title: 'Published Article 1',
            slug: 'published-article-1',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 1,
            published_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            images: [],
          },
          {
            id: 2,
            blog_id: 1,
            title: 'Published Article 2',
            slug: 'published-article-2',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 2,
            published_at: '2024-01-02T00:00:00Z',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            images: [],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 2,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey);

      expect(result.data.every((article) => article.status === 'published')).toBe(true);
      expect(result.data.every((article) => article.published_at !== null)).toBe(true);
    });

    it('should return articles ordered by display_order', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [
          {
            id: 3,
            blog_id: 1,
            title: 'First in Order',
            slug: 'first-in-order',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 1,
            published_at: '2024-01-03T00:00:00Z',
            created_at: '2024-01-03T00:00:00Z',
            updated_at: '2024-01-03T00:00:00Z',
            images: [],
          },
          {
            id: 1,
            blog_id: 1,
            title: 'Second in Order',
            slug: 'second-in-order',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 2,
            published_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            images: [],
          },
          {
            id: 2,
            blog_id: 1,
            title: 'Third in Order',
            slug: 'third-in-order',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 3,
            published_at: '2024-01-02T00:00:00Z',
            created_at: '2024-01-02T00:00:00Z',
            updated_at: '2024-01-02T00:00:00Z',
            images: [],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 3,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey);

      expect(result.data[0].display_order).toBe(1);
      expect(result.data[1].display_order).toBe(2);
      expect(result.data[2].display_order).toBe(3);
    });

    it('should include article images ordered by display_order', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [
          {
            id: 1,
            blog_id: 1,
            title: 'Article with Images',
            slug: 'article-with-images',
            content: '<p>Content</p>',
            status: 'published',
            display_order: 1,
            published_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            images: [
              {
                id: 1,
                article_id: 1,
                url: 'https://example.com/image1.jpg',
                alt_text: 'First Image',
                display_order: 1,
                created_at: '2024-01-01T00:00:00Z',
              },
              {
                id: 2,
                article_id: 1,
                url: 'https://example.com/image2.jpg',
                alt_text: 'Second Image',
                display_order: 2,
                created_at: '2024-01-01T00:00:00Z',
              },
            ],
          },
        ],
        meta: {
          current_page: 1,
          total_pages: 1,
          total_records: 1,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey);

      expect(result.data[0].images).toHaveLength(2);
      expect(result.data[0].images[0].display_order).toBe(1);
      expect(result.data[0].images[1].display_order).toBe(2);
    });

    it('should return empty array when no published articles exist', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [],
        meta: {
          current_page: 1,
          total_pages: 0,
          total_records: 0,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey);

      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total_records).toBe(0);
    });

    it('should handle page beyond available pages', async () => {
      const mockResponse: PublicArticlesResponse = {
        data: [],
        meta: {
          current_page: 10,
          total_pages: 5,
          total_records: 50,
        },
      };

      mockClient.get.mockResolvedValue({ data: mockResponse });

      const result = await fetchPublicArticles(mockSecretKey, { page: 10 });

      expect(result.data).toEqual([]);
      expect(result.meta.current_page).toBe(10);
      expect(result.meta.total_pages).toBe(5);
    });

    it('should handle invalid secret key error', async () => {
      const error = new Error('Unauthorized: Invalid secret key');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticles('invalid-key')).rejects.toThrow(
        'Unauthorized: Invalid secret key'
      );
      expect(createPublicCmsClient).toHaveBeenCalledWith('invalid-key');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticles(mockSecretKey)).rejects.toThrow('Network error');
    });
  });

  describe('fetchPublicArticleBySlug', () => {
    it('should fetch a single published article by slug successfully', async () => {
      const mockArticle: Article = {
        id: 1,
        blog_id: 1,
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Full article content here</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(mockSecretKey, 'test-article');

      expect(createPublicCmsClient).toHaveBeenCalledWith(mockSecretKey);
      expect(mockClient.get).toHaveBeenCalledWith('/articles/test-article');
      expect(result).toEqual(mockArticle);
      expect(result.slug).toBe('test-article');
    });

    it('should return article with complete metadata', async () => {
      const mockArticle: Article = {
        id: 2,
        blog_id: 1,
        title: 'Complete Article',
        slug: 'complete-article',
        content: '<p>Full content</p>',
        status: 'published',
        display_order: 5,
        published_at: '2024-01-15T10:30:00Z',
        created_at: '2024-01-10T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
        images: [],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(mockSecretKey, 'complete-article');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('blog_id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('slug');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('display_order');
      expect(result).toHaveProperty('published_at');
      expect(result).toHaveProperty('created_at');
      expect(result).toHaveProperty('updated_at');
      expect(result).toHaveProperty('images');
    });

    it('should return article with images ordered by display_order', async () => {
      const mockArticle: Article = {
        id: 3,
        blog_id: 1,
        title: 'Article with Multiple Images',
        slug: 'article-with-images',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [
          {
            id: 1,
            article_id: 3,
            url: 'https://example.com/hero.jpg',
            alt_text: 'Hero Image',
            display_order: 1,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 2,
            article_id: 3,
            url: 'https://example.com/thumbnail.jpg',
            alt_text: 'Thumbnail',
            display_order: 2,
            created_at: '2024-01-01T00:00:00Z',
          },
          {
            id: 3,
            article_id: 3,
            url: 'https://example.com/gallery.jpg',
            alt_text: 'Gallery Image',
            display_order: 3,
            created_at: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(mockSecretKey, 'article-with-images');

      expect(result.images).toHaveLength(3);
      expect(result.images[0].display_order).toBe(1);
      expect(result.images[1].display_order).toBe(2);
      expect(result.images[2].display_order).toBe(3);
      expect(result.images[0].alt_text).toBe('Hero Image');
    });

    it('should handle 404 error for non-existent slug', async () => {
      const error = new Error('Article not found');
      mockClient.get.mockRejectedValue(error);

      await expect(
        fetchPublicArticleBySlug(mockSecretKey, 'non-existent-slug')
      ).rejects.toThrow('Article not found');
      expect(mockClient.get).toHaveBeenCalledWith('/articles/non-existent-slug');
    });

    it('should handle 404 error for draft article slug', async () => {
      const error = new Error('Article not found');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticleBySlug(mockSecretKey, 'draft-article')).rejects.toThrow(
        'Article not found'
      );
    });

    it('should handle 404 error for archived article slug', async () => {
      const error = new Error('Article not found');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticleBySlug(mockSecretKey, 'archived-article')).rejects.toThrow(
        'Article not found'
      );
    });

    it('should handle invalid secret key error', async () => {
      const error = new Error('Unauthorized: Invalid secret key');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticleBySlug('invalid-key', 'test-article')).rejects.toThrow(
        'Unauthorized: Invalid secret key'
      );
      expect(createPublicCmsClient).toHaveBeenCalledWith('invalid-key');
    });

    it('should handle network errors', async () => {
      const error = new Error('Network error');
      mockClient.get.mockRejectedValue(error);

      await expect(fetchPublicArticleBySlug(mockSecretKey, 'test-article')).rejects.toThrow(
        'Network error'
      );
    });

    it('should only return published articles (not draft or archived)', async () => {
      const mockArticle: Article = {
        id: 4,
        blog_id: 1,
        title: 'Published Article',
        slug: 'published-article',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(mockSecretKey, 'published-article');

      expect(result.status).toBe('published');
      expect(result.published_at).not.toBeNull();
    });

    it('should handle slugs with special characters', async () => {
      const mockArticle: Article = {
        id: 5,
        blog_id: 1,
        title: 'Article with Special Chars',
        slug: 'article-with-special-chars-2024',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(
        mockSecretKey,
        'article-with-special-chars-2024'
      );

      expect(result.slug).toBe('article-with-special-chars-2024');
    });

    it('should return article belonging to the correct blog (via secret key)', async () => {
      const blogSecretKey = 'blog-specific-secret-key';
      const mockArticle: Article = {
        id: 6,
        blog_id: 5,
        title: 'Blog Specific Article',
        slug: 'blog-specific-article',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      mockClient.get.mockResolvedValue({ data: mockArticle });

      const result = await fetchPublicArticleBySlug(blogSecretKey, 'blog-specific-article');

      expect(createPublicCmsClient).toHaveBeenCalledWith(blogSecretKey);
      expect(result.blog_id).toBe(5);
    });
  });
});
