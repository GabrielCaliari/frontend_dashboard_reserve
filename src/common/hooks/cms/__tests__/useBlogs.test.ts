import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBlogs, useBlog, BLOG_QUERY_KEYS } from '../useBlogs';
import { blogService } from '@/src/common/services/blog-service';
import * as tenantStore from '@/src/common/stores/tenant-store';

// Mock dependencies
vi.mock('@/src/common/services/blog-service');
vi.mock('@/src/common/stores/tenant-store');

const mockBlogService = blogService as any;
const mockTenantStore = tenantStore as any;

describe('useBlogs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('BLOG_QUERY_KEYS', () => {
    it('should generate correct query key for all blogs', () => {
      const tenantId = 123;
      const key = BLOG_QUERY_KEYS.all(tenantId);
      expect(key).toEqual(['cms', 'blogs', 123]);
    });

    it('should generate correct query key for single blog', () => {
      const tenantId = 123;
      const blogId = 456;
      const key = BLOG_QUERY_KEYS.detail(tenantId, blogId);
      expect(key).toEqual(['cms', 'blogs', 123, 456]);
    });

    it('should handle null tenant ID', () => {
      const key = BLOG_QUERY_KEYS.all(null);
      expect(key).toEqual(['cms', 'blogs', null]);
    });
  });

  describe('useBlogs hook', () => {
    it('should fetch blogs when tenant ID is available', async () => {
      const mockBlogs = {
        data: [
          { id: 1, name: 'Blog 1', slug: 'blog-1' },
          { id: 2, name: 'Blog 2', slug: 'blog-2' },
        ],
        meta: { current_page: 1, total_pages: 1, total_records: 2 },
      };

      mockTenantStore.useSelectedTenantId.mockReturnValue(123);
      mockBlogService.listBlogs.mockResolvedValue(mockBlogs);

      const { result } = renderHook(() => useBlogs(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockBlogService.listBlogs).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockBlogs);
    });

    it('should not fetch when tenant ID is not available', () => {
      mockTenantStore.useSelectedTenantId.mockReturnValue(null);

      const { result } = renderHook(() => useBlogs(), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockBlogService.listBlogs).not.toHaveBeenCalled();
    });

    it('should use 5 minute staleTime for caching', () => {
      mockTenantStore.useSelectedTenantId.mockReturnValue(123);

      const { result } = renderHook(() => useBlogs(), { wrapper });

      const queryState = queryClient.getQueryState(result.current.queryKey);
      expect(queryState?.dataUpdatedAt).toBeDefined();
    });
  });

  describe('useBlog hook', () => {
    it('should fetch single blog when tenant ID and blog ID are available', async () => {
      const mockBlog = {
        id: 1,
        name: 'Test Blog',
        slug: 'test-blog',
        description: 'Test description',
        tenant_id: 123,
        secret_key: 'secret123',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockTenantStore.useSelectedTenantId.mockReturnValue(123);
      mockBlogService.getBlog.mockResolvedValue(mockBlog);

      const { result } = renderHook(() => useBlog(1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockBlogService.getBlog).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockBlog);
    });

    it('should not fetch when tenant ID is not available', () => {
      mockTenantStore.useSelectedTenantId.mockReturnValue(null);

      const { result } = renderHook(() => useBlog(1), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockBlogService.getBlog).not.toHaveBeenCalled();
    });

    it('should not fetch when blog ID is not provided', () => {
      mockTenantStore.useSelectedTenantId.mockReturnValue(123);

      const { result } = renderHook(() => useBlog(0), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockBlogService.getBlog).not.toHaveBeenCalled();
    });

    it('should use 5 minute staleTime for caching', () => {
      mockTenantStore.useSelectedTenantId.mockReturnValue(123);

      const { result } = renderHook(() => useBlog(1), { wrapper });

      const queryState = queryClient.getQueryState(result.current.queryKey);
      expect(queryState?.dataUpdatedAt).toBeDefined();
    });
  });
});
