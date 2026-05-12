import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  archiveArticle,
  unarchiveArticle,
} from "@/src/modules/cms/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import { ARTICLE_QUERY_KEYS } from "./useArticles";
import { useCMSToast } from "./use-cms-toast";
import type {
  CreateArticleDto,
  UpdateArticleDto,
  Article,
} from "@/src/shared/domain/types/@cms-article";

/**
 * Hook to create a new article
 *
 * Features:
 * - Invalidates article list cache on success
 * - Creates article with default draft status
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const createArticleMutation = useCreateArticle();
 *
 * const handleCreate = async () => {
 *   const newArticle = await createArticleMutation.mutateAsync({
 *     blogId: 123,
 *     data: {
 *       title: 'My Article',
 *       content: '<p>Article content</p>'
 *     }
 *   });
 *   console.log('Created article:', newArticle);
 * };
 * ```
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function useCreateArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      data,
    }: {
      blogId: number;
      data: CreateArticleDto;
    }) => createArticle({ ...data, blogId: String(blogId) }),
    onSuccess: (_data, variables) => {
      // Invalidate all article queries for this blog to refetch with new article
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId),
      });
      toast.articleCreated();
    },
    onError: (error) => {
      toast.showError(error, "Failed to create article");
    },
  });
}

/**
 * Hook to update an existing article
 *
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Invalidates both list and detail caches on success
 * - Rolls back on error
 * - Does NOT alter article status during content updates
 * - Automatically updates updated_at timestamp
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const updateArticleMutation = useUpdateArticle();
 *
 * const handleUpdate = async () => {
 *   await updateArticleMutation.mutateAsync({
 *     blogId: 123,
 *     articleId: 456,
 *     data: { title: 'Updated Title' }
 *   });
 * };
 * ```
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function useUpdateArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
      data,
    }: {
      blogId: number;
      articleId: number;
      data: UpdateArticleDto;
    }) => updateArticle(articleId, data),
    onMutate: async ({ blogId, articleId, data }) => {
      await queryClient.cancelQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });

      const previousArticle = queryClient.getQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      );

      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
        (old) =>
          old ? { ...old, ...data, updated_at: new Date().toISOString() } : old,
      );

      return { previousArticle };
    },
    onError: (error, { blogId, articleId }, context) => {
      if (context?.previousArticle) {
        queryClient.setQueryData(
          ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
          context.previousArticle,
        );
      }
      toast.showError(error, "Failed to update article");
    },
    onSuccess: (_data, { blogId, articleId }) => {
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId),
      });
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });
      toast.articleUpdated();
    },
  });
}

/**
 * Hook to delete an article
 *
 * Features:
 * - Invalidates article list cache on success
 * - Removes detail cache for the deleted article
 *
 * @returns Mutation object with mutate/mutateAsync functions
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
    }: {
      blogId: number;
      articleId: number;
    }) => deleteArticle(String(articleId)),
    onSuccess: (_data, { blogId, articleId }) => {
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId),
      });
      queryClient.removeQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });
      toast.articleDeleted();
    },
    onError: (error) => {
      toast.showError(error, "Failed to delete article");
    },
  });
}

/**
 * Hook to publish an article (transition from draft to published)
 *
 * Features:
 * - Validates that article is in "draft" status before publishing
 * - Changes status to "published" and sets published_at timestamp
 * - Returns 409 conflict error if article is not in draft status
 * - Invalidates caches to reflect new status
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const publishArticleMutation = usePublishArticle();
 *
 * const handlePublish = async (blogId: number, articleId: number) => {
 *   try {
 *     await publishArticleMutation.mutateAsync({ blogId, articleId });
 *     toast.success('Article published successfully');
 *   } catch (error) {
 *     if (error.response?.status === 409) {
 *       toast.error('Article must be in draft status to publish');
 *     }
 *   }
 * };
 * ```
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function usePublishArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
    }: {
      blogId: number;
      articleId: number;
    }) => publishArticle(articleId),
    onSuccess: (updatedArticle, variables) => {
      // Update the article in cache with new status and published_at
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(
          tenantId,
          variables.blogId,
          variables.articleId,
        ),
        updatedArticle,
      );

      // Invalidate list queries to reflect status change
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId),
      });
      toast.articlePublished();
    },
    onError: (error) => {
      toast.showError(error, "Failed to publish article");
    },
  });
}

/**
 * Hook to archive an article (transition from published to archived)
 *
 * Features:
 * - Validates that article is in "published" status before archiving
 * - Changes status to "archived" and maintains original published_at
 * - Returns 409 conflict error if article is not in published status
 * - Invalidates caches to reflect new status
 *
 * @returns Mutation object with mutate/mutateAsync functions
 *
 * @example
 * ```tsx
 * const archiveArticleMutation = useArchiveArticle();
 *
 * const handleArchive = async (blogId: number, articleId: number) => {
 *   try {
 *     await archiveArticleMutation.mutateAsync({ blogId, articleId });
 *     toast.success('Article archived successfully');
 *   } catch (error) {
 *     if (error.response?.status === 409) {
 *       toast.error('Article must be published to archive');
 *     }
 *   }
 * };
 * ```
 *
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function useArchiveArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
    }: {
      blogId: number;
      articleId: number;
    }) => archiveArticle(String(articleId)),
    onSuccess: (updatedArticle, variables) => {
      // Update the article in cache with new status
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(
          tenantId,
          variables.blogId,
          variables.articleId,
        ),
        updatedArticle,
      );

      // Invalidate list queries to reflect status change
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId),
      });
      toast.articleArchived();
    },
    onError: (error) => {
      toast.showError(error, "Failed to archive article");
    },
  });
}

/**
 * Hook to unarchive an article (transition from archived to published)
 * Restores the article to published state, maintaining the original publishedAt.
 */
export function useUnarchiveArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
    }: {
      blogId: number;
      articleId: number;
    }) => unarchiveArticle(String(articleId)),
    onSuccess: (updatedArticle, variables) => {
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(
          tenantId,
          variables.blogId,
          variables.articleId,
        ),
        updatedArticle,
      );
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId),
      });
      toast.articleUnarchived();
    },
    onError: (error) => {
      toast.showError(error, "Failed to unarchive article");
    },
  });
}
