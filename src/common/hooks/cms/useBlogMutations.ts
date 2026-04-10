import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createBlog,
  updateBlog,
  deleteBlog,
  regenerateBlogSecretKey,
} from "@/src/common/services/cms-blog-service";
import type {
  Blog,
  CreateBlogDto,
  UpdateBlogDto,
} from "@/src/shared/domain/types/@cms-blog";
import { BLOG_QUERY_KEYS } from "./useBlogs";
import { useCMSToast } from "./use-cms-toast";

/**
 * Hook to create a new blog
 * Automatically invalidates the blogs list cache on success
 * Shows success/error toast notifications
 *
 * @returns Mutation object with mutate, mutateAsync, and status properties
 *
 * @example
 * ```tsx
 * const createBlog = useCreateBlog();
 *
 * const handleCreate = async (data: CreateBlogDto) => {
 *   try {
 *     const newBlog = await createBlog.mutateAsync(data);
 *     console.log('Created blog:', newBlog);
 *   } catch (error) {
 *     // Error toast is shown automatically
 *   }
 * };
 * ```
 */
export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  const toast = useCMSToast();

  return useMutation<Blog, Error, CreateBlogDto>({
    mutationFn: createBlog,
    onSuccess: () => {
      // Invalidate blogs list to refetch with new blog
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      toast.blogCreated();
    },
    onError: (error) => {
      toast.showError(error, "Failed to create blog");
    },
  });
};

/**
 * Hook to update an existing blog
 * Automatically invalidates both the blogs list and the specific blog cache on success
 * Shows success/error toast notifications
 *
 * @returns Mutation object with mutate, mutateAsync, and status properties
 *
 * @example
 * ```tsx
 * const updateBlog = useUpdateBlog();
 *
 * const handleUpdate = async (blogId: number, data: UpdateBlogDto) => {
 *   try {
 *     await updateBlog.mutateAsync({ blogId, data });
 *   } catch (error) {
 *     // Error toast is shown automatically
 *   }
 * };
 * ```
 */
export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  const toast = useCMSToast();

  return useMutation<
    Blog,
    Error,
    { blogId: string | number; data: UpdateBlogDto }
  >({
    mutationFn: ({ blogId, data }) => updateBlog(blogId, data),
    onSuccess: (updatedBlog, variables) => {
      // Invalidate blogs list
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      // Invalidate specific blog detail
      queryClient.invalidateQueries({
        queryKey: BLOG_QUERY_KEYS.detail(variables.blogId),
      });
      toast.blogUpdated();
    },
    onError: (error) => {
      toast.showError(error, "Failed to update blog");
    },
  });
};

/**
 * Hook to delete a blog
 * Automatically invalidates the blogs list cache on success
 * Shows success/error toast notifications
 * Note: This cascades to delete all associated articles and images
 *
 * @returns Mutation object with mutate, mutateAsync, and status properties
 *
 * @example
 * ```tsx
 * const deleteBlog = useDeleteBlog();
 *
 * const handleDelete = async (blogId: number) => {
 *   if (confirm('Are you sure? This will delete all articles and images.')) {
 *     try {
 *       await deleteBlog.mutateAsync(blogId);
 *     } catch (error) {
 *       // Error toast is shown automatically
 *     }
 *   }
 * };
 * ```
 */
export const useDeleteBlog = () => {
  const queryClient = useQueryClient();
  const toast = useCMSToast();

  return useMutation<void, Error, number>({
    mutationFn: deleteBlog,
    onSuccess: (_, blogId) => {
      // Invalidate blogs list
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      // Remove specific blog from cache
      queryClient.removeQueries({
        queryKey: BLOG_QUERY_KEYS.detail(blogId),
      });
      toast.blogDeleted();
    },
    onError: (error) => {
      toast.showError(error, "Failed to delete blog");
    },
  });
};

/**
 * Hook to regenerate a blog's secret key
 * Automatically invalidates both the blogs list and the specific blog cache on success
 * Shows success/error toast notifications
 * Note: This immediately invalidates the previous secret key
 *
 * @returns Mutation object with mutate, mutateAsync, and status properties
 *
 * @example
 * ```tsx
 * const regenerateKey = useRegenerateBlogKey();
 *
 * const handleRegenerate = async (blogId: number) => {
 *   if (confirm('This will invalidate the current key. Continue?')) {
 *     try {
 *       const blogWithNewKey = await regenerateKey.mutateAsync(blogId);
 *       console.log('New secret key:', blogWithNewKey.secret_key);
 *     } catch (error) {
 *       // Error toast is shown automatically
 *     }
 *   }
 * };
 * ```
 */
export const useRegenerateBlogKey = () => {
  const queryClient = useQueryClient();
  const toast = useCMSToast();

  return useMutation<Blog, Error, number>({
    mutationFn: regenerateBlogSecretKey,
    onSuccess: (updatedBlog, blogId) => {
      // Invalidate blogs list
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      // Invalidate specific blog detail
      queryClient.invalidateQueries({
        queryKey: BLOG_QUERY_KEYS.detail(blogId),
      });
      toast.blogKeyRegenerated();
    },
    onError: (error) => {
      toast.showError(error, "Failed to regenerate secret key");
    },
  });
};
