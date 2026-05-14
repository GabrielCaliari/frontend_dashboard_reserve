import { useQuery } from "@tanstack/react-query";
import {
  fetchBlogs,
  fetchBlogById,
} from "@/src/modules/cms/infrastructure/adapters";
import type { Blog } from "@/src/shared/domain/types/@cms-blog";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

/**
 * Query keys for blog-related queries
 * Used for cache management and invalidation
 */
export const BLOG_QUERY_KEYS = {
  all: ["cms", "blogs"] as const,
  detail: (id: string | number) => ["cms", "blogs", id] as const,
};

/**
 * Hook to fetch all blogs for the authenticated tenant
 *
 * @returns Query result with blogs data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: blogs, isLoading, error } = useBlogs();
 * ```
 */
export const useBlogs = () => {
  const tenantId = useSelectedTenantId();
  return useQuery<Blog[], Error>({
    queryKey: [...BLOG_QUERY_KEYS.all, tenantId],
    queryFn: fetchBlogs,
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes - blogs don't change frequently
  });
};

/**
 * Hook to fetch a single blog by ID
 *
 * @param blogId - The ID of the blog to fetch
 * @returns Query result with blog data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: blog, isLoading, error } = useBlog(blogId);
 * ```
 */
export const useBlog = (blogId: string | number) => {
  return useQuery<Blog, Error>({
    queryKey: BLOG_QUERY_KEYS.detail(blogId),
    queryFn: () => fetchBlogById(blogId),
    enabled: !!blogId, // Only run query if blogId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
