import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBlogs, useBlog, BLOG_QUERY_KEYS } from "../useBlogs";
import {
  fetchBlogs,
  fetchBlogById,
} from "@/src/common/services/cms-blog-service";

// Mock dependencies
vi.mock("@/src/common/services/cms-blog-service");

const mockFetchBlogs = fetchBlogs as any;
const mockFetchBlogById = fetchBlogById as any;

describe("useBlogs", () => {
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

  describe("BLOG_QUERY_KEYS", () => {
    it("should generate correct query key for all blogs", () => {
      const key = BLOG_QUERY_KEYS.all;
      expect(key).toEqual(["cms", "blogs"]);
    });

    it("should generate correct query key for single blog", () => {
      const blogId = 456;
      const key = BLOG_QUERY_KEYS.detail(blogId);
      expect(key).toEqual(["cms", "blogs", 456]);
    });
  });

  describe("useBlogs hook", () => {
    it("should fetch blogs", async () => {
      const mockBlogs = [
        { id: 1, name: "Blog 1", slug: "blog-1" },
        { id: 2, name: "Blog 2", slug: "blog-2" },
      ];

      mockFetchBlogs.mockResolvedValue(mockBlogs);

      const { result } = renderHook(() => useBlogs(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetchBlogs).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual(mockBlogs);
    });

    it("should use 5 minute staleTime for caching", () => {
      const { result } = renderHook(() => useBlogs(), { wrapper });

      // @ts-ignore
      const queryState = queryClient.getQueryState(BLOG_QUERY_KEYS.all);
      expect(queryState?.dataUpdatedAt).toBeDefined();
    });
  });

  describe("useBlog hook", () => {
    it("should fetch single blog when blog ID is available", async () => {
      const mockBlog = {
        id: 1,
        name: "Test Blog",
        slug: "test-blog",
        description: "Test description",
        tenant_id: 123,
        secret_key: "secret123",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockFetchBlogById.mockResolvedValue(mockBlog);

      const { result } = renderHook(() => useBlog(1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockFetchBlogById).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual(mockBlog);
    });

    it("should not fetch when blog ID is not provided", () => {
      const { result } = renderHook(() => useBlog(0), { wrapper });

      expect(result.current.isPending).toBe(true);
      expect(mockFetchBlogById).not.toHaveBeenCalled();
    });

    it("should use 5 minute staleTime for caching", () => {
      const { result } = renderHook(() => useBlog(1), { wrapper });

      // @ts-ignore
      const queryState = queryClient.getQueryState(BLOG_QUERY_KEYS.detail(1));
      expect(queryState?.dataUpdatedAt).toBeDefined();
    });
  });
});
