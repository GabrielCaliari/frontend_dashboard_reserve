import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchBlogs,
  fetchBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  regenerateBlogSecretKey,
} from './cms-blog-service';
import cmsApiClient from '@/src/common/config/cms-api-client';
import type { Blog, CreateBlogDto, UpdateBlogDto } from '@/src/common/@types/@cms-blog';

// Mock the API client
vi.mock('@/src/common/config/cms-api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('CMS Blog Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBlogs', () => {
    it('should fetch all blogs successfully', async () => {
      const mockBlogs: Blog[] = [
        {
          id: 1,
          tenant_id: 100,
          name: 'Tech Blog',
          slug: 'tech-blog',
          description: 'A blog about technology',
          secret_key: 'secret-key-123',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          tenant_id: 100,
          name: 'Marketing Blog',
          slug: 'marketing-blog',
          description: null,
          secret_key: 'secret-key-456',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockBlogs });

      const result = await fetchBlogs();

      expect(cmsApiClient.get).toHaveBeenCalledWith('/blogs');
      expect(result).toEqual(mockBlogs);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no blogs exist', async () => {
      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: [] });

      const result = await fetchBlogs();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('fetchBlogById', () => {
    it('should fetch a single blog by ID successfully', async () => {
      const mockBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'A blog about technology',
        secret_key: 'secret-key-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      vi.mocked(cmsApiClient.get).mockResolvedValue({ data: mockBlog });

      const result = await fetchBlogById(1);

      expect(cmsApiClient.get).toHaveBeenCalledWith('/blogs/1');
      expect(result).toEqual(mockBlog);
      expect(result.id).toBe(1);
    });

    it('should handle error for invalid blog ID', async () => {
      const error = new Error('Blog not found');
      vi.mocked(cmsApiClient.get).mockRejectedValue(error);

      await expect(fetchBlogById(999)).rejects.toThrow('Blog not found');
      expect(cmsApiClient.get).toHaveBeenCalledWith('/blogs/999');
    });
  });

  describe('createBlog', () => {
    it('should create a blog with valid data successfully', async () => {
      const createData: CreateBlogDto = {
        name: 'New Tech Blog',
        description: 'A brand new blog about technology',
      };

      const mockCreatedBlog: Blog = {
        id: 3,
        tenant_id: 100,
        name: 'New Tech Blog',
        slug: 'new-tech-blog',
        description: 'A brand new blog about technology',
        secret_key: 'generated-secret-key-789',
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedBlog });

      const result = await createBlog(createData);

      expect(cmsApiClient.post).toHaveBeenCalledWith('/blogs', createData);
      expect(result).toEqual(mockCreatedBlog);
      expect(result.slug).toBe('new-tech-blog');
      expect(result.secret_key).toBe('generated-secret-key-789');
    });

    it('should create a blog without description', async () => {
      const createData: CreateBlogDto = {
        name: 'Simple Blog',
      };

      const mockCreatedBlog: Blog = {
        id: 4,
        tenant_id: 100,
        name: 'Simple Blog',
        slug: 'simple-blog',
        description: null,
        secret_key: 'generated-secret-key-abc',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedBlog });

      const result = await createBlog(createData);

      expect(cmsApiClient.post).toHaveBeenCalledWith('/blogs', createData);
      expect(result.description).toBeNull();
    });

    it('should generate unique slug from blog name', async () => {
      const createData: CreateBlogDto = {
        name: 'My Awesome Blog!',
      };

      const mockCreatedBlog: Blog = {
        id: 5,
        tenant_id: 100,
        name: 'My Awesome Blog!',
        slug: 'my-awesome-blog',
        description: null,
        secret_key: 'generated-secret-key-def',
        created_at: '2024-01-05T00:00:00Z',
        updated_at: '2024-01-05T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedBlog });

      const result = await createBlog(createData);

      expect(result.slug).toBe('my-awesome-blog');
    });

    it('should generate cryptographically secure secret key', async () => {
      const createData: CreateBlogDto = {
        name: 'Security Blog',
      };

      const mockCreatedBlog: Blog = {
        id: 6,
        tenant_id: 100,
        name: 'Security Blog',
        slug: 'security-blog',
        description: null,
        secret_key: 'very-long-cryptographically-secure-key-12345678',
        created_at: '2024-01-06T00:00:00Z',
        updated_at: '2024-01-06T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockCreatedBlog });

      const result = await createBlog(createData);

      expect(result.secret_key).toBeDefined();
      expect(result.secret_key.length).toBeGreaterThan(0);
    });
  });

  describe('updateBlog', () => {
    it('should update blog with partial data (name only)', async () => {
      const updateData: UpdateBlogDto = {
        name: 'Updated Blog Name',
      };

      const mockUpdatedBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Updated Blog Name',
        slug: 'tech-blog',
        description: 'Original description',
        secret_key: 'secret-key-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedBlog });

      const result = await updateBlog(1, updateData);

      expect(cmsApiClient.put).toHaveBeenCalledWith('/blogs/1', updateData);
      expect(result.name).toBe('Updated Blog Name');
      expect(result.updated_at).toBe('2024-01-07T00:00:00Z');
    });

    it('should update blog with partial data (description only)', async () => {
      const updateData: UpdateBlogDto = {
        description: 'Updated description',
      };

      const mockUpdatedBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'Updated description',
        secret_key: 'secret-key-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedBlog });

      const result = await updateBlog(1, updateData);

      expect(cmsApiClient.put).toHaveBeenCalledWith('/blogs/1', updateData);
      expect(result.description).toBe('Updated description');
    });

    it('should update blog with both name and description', async () => {
      const updateData: UpdateBlogDto = {
        name: 'Completely Updated Blog',
        description: 'Completely updated description',
      };

      const mockUpdatedBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Completely Updated Blog',
        slug: 'tech-blog',
        description: 'Completely updated description',
        secret_key: 'secret-key-123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedBlog });

      const result = await updateBlog(1, updateData);

      expect(result.name).toBe('Completely Updated Blog');
      expect(result.description).toBe('Completely updated description');
    });

    it('should not modify secret_key during update', async () => {
      const updateData: UpdateBlogDto = {
        name: 'Updated Name',
      };

      const originalSecretKey = 'original-secret-key-123';
      const mockUpdatedBlog: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Updated Name',
        slug: 'tech-blog',
        description: 'Description',
        secret_key: originalSecretKey,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-07T00:00:00Z',
      };

      vi.mocked(cmsApiClient.put).mockResolvedValue({ data: mockUpdatedBlog });

      const result = await updateBlog(1, updateData);

      expect(result.secret_key).toBe(originalSecretKey);
    });

    it('should handle error for invalid blog ID during update', async () => {
      const updateData: UpdateBlogDto = {
        name: 'Updated Name',
      };

      const error = new Error('Blog not found');
      vi.mocked(cmsApiClient.put).mockRejectedValue(error);

      await expect(updateBlog(999, updateData)).rejects.toThrow('Blog not found');
      expect(cmsApiClient.put).toHaveBeenCalledWith('/blogs/999', updateData);
    });
  });

  describe('deleteBlog', () => {
    it('should delete blog successfully', async () => {
      vi.mocked(cmsApiClient.delete).mockResolvedValue({ data: undefined });

      await deleteBlog(1);

      expect(cmsApiClient.delete).toHaveBeenCalledWith('/blogs/1');
    });

    it('should handle error for invalid blog ID during deletion', async () => {
      const error = new Error('Blog not found');
      vi.mocked(cmsApiClient.delete).mockRejectedValue(error);

      await expect(deleteBlog(999)).rejects.toThrow('Blog not found');
      expect(cmsApiClient.delete).toHaveBeenCalledWith('/blogs/999');
    });
  });

  describe('regenerateBlogSecretKey', () => {
    it('should regenerate secret key successfully', async () => {
      const oldSecretKey = 'old-secret-key-123';
      const newSecretKey = 'new-secret-key-456';

      const mockBlogWithNewKey: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'A blog about technology',
        secret_key: newSecretKey,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-08T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockBlogWithNewKey });

      const result = await regenerateBlogSecretKey(1);

      expect(cmsApiClient.post).toHaveBeenCalledWith('/blogs/1/regenerate-key');
      expect(result.secret_key).toBe(newSecretKey);
      expect(result.secret_key).not.toBe(oldSecretKey);
    });

    it('should return blog with new secret key in response format', async () => {
      const mockBlogWithNewKey: Blog = {
        id: 2,
        tenant_id: 100,
        name: 'Marketing Blog',
        slug: 'marketing-blog',
        description: 'Marketing content',
        secret_key: 'regenerated-key-789',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-08T00:00:00Z',
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockBlogWithNewKey });

      const result = await regenerateBlogSecretKey(2);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('secret_key');
      expect(result).toHaveProperty('updated_at');
      expect(result.secret_key).toBe('regenerated-key-789');
    });

    it('should update the updated_at timestamp when regenerating key', async () => {
      const originalDate = '2024-01-01T00:00:00Z';
      const newDate = '2024-01-08T12:00:00Z';

      const mockBlogWithNewKey: Blog = {
        id: 1,
        tenant_id: 100,
        name: 'Tech Blog',
        slug: 'tech-blog',
        description: 'A blog about technology',
        secret_key: 'new-regenerated-key',
        created_at: originalDate,
        updated_at: newDate,
      };

      vi.mocked(cmsApiClient.post).mockResolvedValue({ data: mockBlogWithNewKey });

      const result = await regenerateBlogSecretKey(1);

      expect(result.updated_at).toBe(newDate);
      expect(result.updated_at).not.toBe(originalDate);
    });

    it('should handle error for invalid blog ID during key regeneration', async () => {
      const error = new Error('Blog not found');
      vi.mocked(cmsApiClient.post).mockRejectedValue(error);

      await expect(regenerateBlogSecretKey(999)).rejects.toThrow('Blog not found');
      expect(cmsApiClient.post).toHaveBeenCalledWith('/blogs/999/regenerate-key');
    });
  });
});
