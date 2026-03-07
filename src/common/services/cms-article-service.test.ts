import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchArticles,
  fetchArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  archiveArticle,
  reorderArticles,
} from './cms-article-service';
import { cmsApiClient } from '@/src/common/config/api';
import type {
  Article,
  ArticleStatus,
  CreateArticleDto,
  UpdateArticleDto,
  ReorderArticleDto,
} from '@/src/common/@types/@cms-article';

// Mock the API client
vi.mock('@/src/common/config/cms-api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CMS Article Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchArticles', () => {
    const blogId = 1;

    it('should fetch all articles without status filter', async () => {
      const mockArticles: Article[] = [
        {
          id: 1,
          blog_id: blogId,
          title: 'First Article',
          slug: 'first-article',
          content: '<p>Content here</p>',
          status: 'draft',
          display_order: 1,
          published_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          images: [],
        },
        {
          id: 2,
          blog_id: blogId,
          title: 'Second Article',
          slug: 'second-article',
          content: '<p>More content</p>',
          status: 'published',
          display_order: 2,
          published_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          images: [],
        },
      ];

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockArticles });

      const result = await fetchArticles(blogId);

      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles`, { params: {} });
      expect(result).toEqual(mockArticles);
      expect(result).toHaveLength(2);
    });

    it('should fetch articles filtered by draft status', async () => {
      const mockDraftArticles: Article[] = [
        {
          id: 1,
          blog_id: blogId,
          title: 'Draft Article',
          slug: 'draft-article',
          content: '<p>Draft content</p>',
          status: 'draft',
          display_order: 1,
          published_at: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          images: [],
        },
      ];

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockDraftArticles });

      const result = await fetchArticles(blogId, 'draft');

      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles`, {
        params: { status: 'draft' },
      });
      expect(result).toEqual(mockDraftArticles);
      expect(result.every((article) => article.status === 'draft')).toBe(true);
    });

    it('should fetch articles filtered by published status', async () => {
      const mockPublishedArticles: Article[] = [
        {
          id: 2,
          blog_id: blogId,
          title: 'Published Article',
          slug: 'published-article',
          content: '<p>Published content</p>',
          status: 'published',
          display_order: 1,
          published_at: '2024-01-02T00:00:00Z',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          images: [],
        },
      ];

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockPublishedArticles });

      const result = await fetchArticles(blogId, 'published');

      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles`, {
        params: { status: 'published' },
      });
      expect(result).toEqual(mockPublishedArticles);
      expect(result.every((article) => article.status === 'published')).toBe(true);
    });

    it('should fetch articles filtered by archived status', async () => {
      const mockArchivedArticles: Article[] = [
        {
          id: 3,
          blog_id: blogId,
          title: 'Archived Article',
          slug: 'archived-article',
          content: '<p>Archived content</p>',
          status: 'archived',
          display_order: 1,
          published_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-03T00:00:00Z',
          images: [],
        },
      ];

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockArchivedArticles });

      const result = await fetchArticles(blogId, 'archived');

      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles`, {
        params: { status: 'archived' },
      });
      expect(result).toEqual(mockArchivedArticles);
      expect(result.every((article) => article.status === 'archived')).toBe(true);
    });

    it('should return empty array when no articles exist', async () => {
      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: [] });

      const result = await fetchArticles(blogId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchArticleById', () => {
    const blogId = 1;
    const articleId = 1;

    it('should fetch a single article by ID successfully', async () => {
      const mockArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Test Article',
        slug: 'test-article',
        content: '<p>Test content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockArticle });

      const result = await fetchArticleById(blogId, articleId);

      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles/${articleId}`);
      expect(result).toEqual(mockArticle);
      expect(result.id).toBe(articleId);
    });

    it('should handle error for invalid article ID', async () => {
      const error = new Error('Article not found');
      vi.mocked(cmsApiClient.get).mockRejectedValue(error);

      await expect(fetchArticleById(blogId, 999)).rejects.toThrow('Article not found');
      expect(cmsApiClient.get).toHaveBeenCalledWith(`/blogs/${blogId}/articles/999`);
    });
  });

  describe('createArticle', () => {
    const blogId = 1;

    it('should create article with default draft status', async () => {
      const createData: CreateArticleDto = {
        displayTitle: 'New Article',
        metaTitle: 'New Article',
        slug: 'new-article',
        authorId: '1',
        content: '<p>New article content</p>',
      };

      const mockCreatedArticle: Article = {
        id: 1,
        blog_id: blogId,
        title: 'New Article',
        slug: 'new-article',
        content: '<p>New article content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedArticle });

      const result = await createArticle(blogId, createData);

      expect(cmsApiClient.post).toHaveBeenCalledWith(`/blogs/${blogId}/articles`, createData);
      expect(result).toEqual(mockCreatedArticle);
      expect(result.status).toBe('draft');
      expect(result.published_at).toBeNull();
    });

    it('should generate unique slug from article title', async () => {
      const createData: CreateArticleDto = {
        displayTitle: 'My Awesome Article!',
        metaTitle: 'My Awesome Article!',
        slug: 'my-awesome-article',
        authorId: '1',
        content: '<p>Content</p>',
      };

      const mockCreatedArticle: Article = {
        id: 2,
        blog_id: blogId,
        title: 'My Awesome Article!',
        slug: 'my-awesome-article',
        content: '<p>Content</p>',
        status: 'draft',
        display_order: 2,
        published_at: null,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedArticle });

      const result = await createArticle(blogId, createData);

      expect(result.slug).toBe('my-awesome-article');
    });

    it('should set display_order automatically to position article last', async () => {
      const createData: CreateArticleDto = {
        displayTitle: 'Third Article',
        metaTitle: 'Third Article',
        slug: 'third-article',
        authorId: '1',
        content: '<p>Content</p>',
      };

      const mockCreatedArticle: Article = {
        id: 3,
        blog_id: blogId,
        title: 'Third Article',
        slug: 'third-article',
        content: '<p>Content</p>',
        status: 'draft',
        display_order: 3,
        published_at: null,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedArticle });

      const result = await createArticle(blogId, createData);

      expect(result.display_order).toBe(3);
    });

    it('should not set published_at for draft articles', async () => {
      const createData: CreateArticleDto = {
        displayTitle: 'Draft Article',
        metaTitle: 'Draft Article',
        slug: 'draft-article',
        authorId: '1',
        content: '<p>Draft content</p>',
      };

      const mockCreatedArticle: Article = {
        id: 4,
        blog_id: blogId,
        title: 'Draft Article',
        slug: 'draft-article',
        content: '<p>Draft content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedArticle });

      const result = await createArticle(blogId, createData);

      expect(result.published_at).toBeNull();
    });
  });

  describe('updateArticle', () => {
    const blogId = 1;
    const articleId = 1;

    it('should update article with partial data (title only)', async () => {
      const updateData: UpdateArticleDto = {
        displayTitle: 'Updated Title',
      };

      const mockUpdatedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Updated Title',
        slug: 'original-slug',
        content: '<p>Original content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedArticle });

      const result = await updateArticle(blogId, articleId, updateData);

      expect(cmsApiClient.put).toHaveBeenCalledWith(
        `/blogs/${blogId}/articles/${articleId}`,
        updateData
      );
      expect(result.title).toBe('Updated Title');
      expect(result.updated_at).toBe('2024-01-05T00:00:00Z');
    });

    it('should update article with partial data (content only)', async () => {
      const updateData: UpdateArticleDto = {
        content: '<p>Updated content</p>',
      };

      const mockUpdatedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Original Title',
        slug: 'original-slug',
        content: '<p>Updated content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedArticle });

      const result = await updateArticle(blogId, articleId, updateData);

      expect(result.content).toBe('<p>Updated content</p>');
    });

    it('should not alter article status during content updates', async () => {
      const updateData: UpdateArticleDto = {
        displayTitle: 'Updated Title',
        content: '<p>Updated content</p>',
      };

      const mockUpdatedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Updated Title',
        slug: 'article-slug',
        content: '<p>Updated content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedArticle });

      const result = await updateArticle(blogId, articleId, updateData);

      expect(result.status).toBe('published');
      expect(result.published_at).toBe('2024-01-02T00:00:00Z');
    });

    it('should maintain original slug without regeneration', async () => {
      const originalSlug = 'original-slug';
      const updateData: UpdateArticleDto = {
        displayTitle: 'Completely Different Title',
      };

      const mockUpdatedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Completely Different Title',
        slug: originalSlug,
        content: '<p>Content</p>',
        status: 'draft',
        display_order: 1,
        published_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedArticle });

      const result = await updateArticle(blogId, articleId, updateData);

      expect(result.slug).toBe(originalSlug);
    });

    it('should handle error for invalid article ID', async () => {
      const updateData: UpdateArticleDto = {
        displayTitle: 'Updated Title',
      };

      const error = new Error('Article not found');
      vi.mocked(cmsApiClient.put).mockRejectedValue(error);

      await expect(updateArticle(blogId, 999, updateData)).rejects.toThrow('Article not found');
    });
  });

  describe('deleteArticle', () => {
    const blogId = 1;
    const articleId = 1;

    it('should delete article successfully', async () => {
      vi.mocked(cmsApiClient.delete).mockResolvedValue({ data: undefined });

      await deleteArticle(blogId, articleId);

      expect(cmsApiClient.delete).toHaveBeenCalledWith(`/blogs/${blogId}/articles/${articleId}`);
    });

    it('should handle error for invalid article ID', async () => {
      const error = new Error('Article not found');
      vi.mocked(cmsApiClient.delete).mockRejectedValue(error);

      await expect(deleteArticle(blogId, 999)).rejects.toThrow('Article not found');
    });
  });

  describe('publishArticle', () => {
    const blogId = 1;
    const articleId = 1;

    it('should publish article from draft status successfully', async () => {
      const mockPublishedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article to Publish',
        slug: 'article-to-publish',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-05T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockPublishedArticle });

      const result = await publishArticle(blogId, articleId);

      expect(cmsApiClient.post).toHaveBeenCalledWith(
        `/blogs/${blogId}/articles/${articleId}/publish`
      );
      expect(result.status).toBe('published');
      expect(result.published_at).toBe('2024-01-05T00:00:00Z');
    });

    it('should set published_at timestamp when publishing', async () => {
      const mockPublishedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article',
        slug: 'article',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-05T12:30:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T12:30:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockPublishedArticle });

      const result = await publishArticle(blogId, articleId);

      expect(result.published_at).not.toBeNull();
      expect(result.published_at).toBe('2024-01-05T12:30:00Z');
    });

    it('should handle error for invalid status transition (not draft)', async () => {
      const error = new Error('Article must be in draft status to publish');
      vi.mocked(cmsApiClient.post).mockRejectedValue(error);

      await expect(publishArticle(blogId, articleId)).rejects.toThrow(
        'Article must be in draft status to publish'
      );
    });
  });

  describe('archiveArticle', () => {
    const blogId = 1;
    const articleId = 2;

    it('should archive article from published status successfully', async () => {
      const mockArchivedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article to Archive',
        slug: 'article-to-archive',
        content: '<p>Content</p>',
        status: 'archived',
        display_order: 1,
        published_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockArchivedArticle });

      const result = await archiveArticle(blogId, articleId);

      expect(cmsApiClient.post).toHaveBeenCalledWith(
        `/blogs/${blogId}/articles/${articleId}/archive`
      );
      expect(result.status).toBe('archived');
    });

    it('should maintain original published_at when archiving', async () => {
      const originalPublishedAt = '2024-01-02T00:00:00Z';
      const mockArchivedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article',
        slug: 'article',
        content: '<p>Content</p>',
        status: 'archived',
        display_order: 1,
        published_at: originalPublishedAt,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockArchivedArticle });

      const result = await archiveArticle(blogId, articleId);

      expect(result.published_at).toBe(originalPublishedAt);
    });

    it('should handle error for invalid status transition (not published)', async () => {
      const error = new Error('Article must be in published status to archive');
      vi.mocked(cmsApiClient.post).mockRejectedValue(error);

      await expect(archiveArticle(blogId, articleId)).rejects.toThrow(
        'Article must be in published status to archive'
      );
    });
  });

  describe('reorderArticles', () => {
    const blogId = 1;

    it('should reorder multiple articles successfully', async () => {
      const reorderData: ReorderArticleDto[] = [
        { id: 1, display_order: 3 },
        { id: 2, display_order: 1 },
        { id: 3, display_order: 2 },
      ];

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: undefined });

      await reorderArticles(blogId, reorderData);

      expect(cmsApiClient.put).toHaveBeenCalledWith(`/blogs/${blogId}/articles/reorder`, {
        order: reorderData,
      });
    });

    it('should handle reordering with gaps in display_order', async () => {
      const reorderData: ReorderArticleDto[] = [
        { id: 1, display_order: 10 },
        { id: 2, display_order: 20 },
        { id: 3, display_order: 30 },
      ];

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: undefined });

      await reorderArticles(blogId, reorderData);

      expect(cmsApiClient.put).toHaveBeenCalledWith(`/blogs/${blogId}/articles/reorder`, {
        order: reorderData,
      });
    });

    it('should handle reordering single article', async () => {
      const reorderData: ReorderArticleDto[] = [{ id: 1, display_order: 5 }];

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: undefined });

      await reorderArticles(blogId, reorderData);

      expect(cmsApiClient.put).toHaveBeenCalledWith(`/blogs/${blogId}/articles/reorder`, {
        order: reorderData,
      });
    });

    it('should handle error for invalid article IDs', async () => {
      const reorderData: ReorderArticleDto[] = [
        { id: 999, display_order: 1 },
        { id: 998, display_order: 2 },
      ];

      const error = new Error('One or more articles not found');
      vi.mocked(cmsApiClient.put).mockRejectedValue(error);

      await expect(reorderArticles(blogId, reorderData)).rejects.toThrow(
        'One or more articles not found'
      );
    });
  });

  describe('Article status transitions', () => {
    const blogId = 1;

    it('should transition article from draft to published', async () => {
      const articleId = 1;
      const mockPublishedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article',
        slug: 'article',
        content: '<p>Content</p>',
        status: 'published',
        display_order: 1,
        published_at: '2024-01-05T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockPublishedArticle });

      const result = await publishArticle(blogId, articleId);

      expect(result.status).toBe('published');
      expect(result.published_at).not.toBeNull();
    });

    it('should transition article from published to archived', async () => {
      const articleId = 2;
      const mockArchivedArticle: Article = {
        id: articleId,
        blog_id: blogId,
        title: 'Article',
        slug: 'article',
        content: '<p>Content</p>',
        status: 'archived',
        display_order: 1,
        published_at: '2024-01-02T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
        images: [],
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockArchivedArticle });

      const result = await archiveArticle(blogId, articleId);

      expect(result.status).toBe('archived');
      expect(result.published_at).toBe('2024-01-02T00:00:00Z');
    });

    it('should reject invalid transition from draft to archived', async () => {
      const articleId = 3;
      const error = new Error('Invalid status transition');
      vi.mocked(cmsApiClient.post).mockRejectedValue(error);

      await expect(archiveArticle(blogId, articleId)).rejects.toThrow('Invalid status transition');
    });

    it('should reject invalid transition from archived to published', async () => {
      const articleId = 4;
      const error = new Error('Invalid status transition');
      vi.mocked(cmsApiClient.post).mockRejectedValue(error);

      await expect(publishArticle(blogId, articleId)).rejects.toThrow('Invalid status transition');
    });
  });
});
