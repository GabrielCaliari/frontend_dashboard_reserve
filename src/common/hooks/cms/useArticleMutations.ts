import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  archiveArticle,
  reorderArticles,
} from '@/src/common/services/cms-article-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { ARTICLE_QUERY_KEYS } from './useArticles';
import { useCMSToast } from './use-cms-toast';
import type {
  CreateArticleDto,
  UpdateArticleDto,
  ReorderArticleDto,
  Article,
} from '@/src/common/@types/@cms-article';

/**
 * Hook to create a new article
 * 
 * Features:
 * - Invalidates article list cache on success
 * - Creates article with default draft status
 * - Automatically sets display_order to position article last
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
    mutationFn: ({ blogId, data }: { blogId: number; data: CreateArticleDto }) =>
      createArticle(blogId, data),
    onSuccess: (_data, variables) => {
      // Invalidate all article queries for this blog to refetch with new article
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId) 
      });
      toast.articleCreated();
    },
    onError: (error) => {
      toast.showError(error, 'Failed to create article');
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
      data 
    }: { 
      blogId: number; 
      articleId: number; 
      data: UpdateArticleDto 
    }) => updateArticle(blogId, articleId, data),
    onMutate: async ({ blogId, articleId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId) 
      });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId)
      );

      // Optimistically update the cache
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
        (old) => (old ? { ...old, ...data, updated_at: new Date().toISOString() } : old)
      );

      return { previousArticle };
    },
    onError: (error, { blogId, articleId }, context) => {
      // Rollback on error
      if (context?.previousArticle) {
        queryClient.setQueryData(
          ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
          context.previousArticle
        );
      }
      toast.showError(error, 'Failed to update article');
    },
    onSuccess: (_data, { blogId, articleId }) => {
      // Invalidate both list and detail queries
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId) 
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
 * - Cascades to delete all associated images
 * - Removes physical image files from storage (S3)
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const deleteArticleMutation = useDeleteArticle();
 * 
 * const handleDelete = async (blogId: number, articleId: number) => {
 *   if (confirm('Delete this article and all its images?')) {
 *     await deleteArticleMutation.mutateAsync({ blogId, articleId });
 *   }
 * };
 * ```
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function useDeleteArticle() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({ blogId, articleId }: { blogId: number; articleId: number }) =>
      deleteArticle(blogId, articleId),
    onSuccess: (_data, variables) => {
      // Invalidate the article list to remove deleted article
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId) 
      });
      // Also remove the specific article from cache
      queryClient.removeQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, variables.blogId, variables.articleId) 
      });
      toast.articleDeleted();
    },
    onError: (error) => {
      toast.showError(error, 'Failed to delete article');
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
    mutationFn: ({ blogId, articleId }: { blogId: number; articleId: number }) =>
      publishArticle(blogId, articleId),
    onSuccess: (updatedArticle, variables) => {
      // Update the article in cache with new status and published_at
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, variables.blogId, variables.articleId),
        updatedArticle
      );
      
      // Invalidate list queries to reflect status change
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId) 
      });
      toast.articlePublished();
    },
    onError: (error) => {
      toast.showError(error, 'Failed to publish article');
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
    mutationFn: ({ blogId, articleId }: { blogId: number; articleId: number }) =>
      archiveArticle(blogId, articleId),
    onSuccess: (updatedArticle, variables) => {
      // Update the article in cache with new status
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, variables.blogId, variables.articleId),
        updatedArticle
      );
      
      // Invalidate list queries to reflect status change
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId) 
      });
      toast.articleArchived();
    },
    onError: (error) => {
      toast.showError(error, 'Failed to archive article');
    },
  });
}

/**
 * Hook to reorder articles by updating display_order values
 * 
 * Features:
 * - Optimistic updates for immediate drag-and-drop feedback
 * - Updates all articles in a single transaction
 * - Does NOT validate uniqueness or sequence of display_order (gaps allowed)
 * - Rolls back on error
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const reorderArticlesMutation = useReorderArticles();
 * 
 * const handleReorder = async (blogId: number, newOrder: ReorderArticleDto[]) => {
 *   await reorderArticlesMutation.mutateAsync({ blogId, order: newOrder });
 * };
 * 
 * // Example order data:
 * const order = [
 *   { id: 1, display_order: 0 },
 *   { id: 2, display_order: 1 },
 *   { id: 3, display_order: 2 },
 * ];
 * ```
 * 
 * **Validates: Requirements 15.1, 15.2, 15.3**
 */
export function useReorderArticles() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({ blogId, order }: { blogId: number; order: ReorderArticleDto[] }) =>
      reorderArticles(blogId, order),
    onMutate: async ({ blogId, order }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId) 
      });

      // Snapshot previous value
      const previousArticles = queryClient.getQueryData(
        ARTICLE_QUERY_KEYS.all(tenantId, blogId)
      );

      // Optimistically update the cache
      // Create a map of new display orders
      const orderMap = new Map(order.map(item => [item.id, item.display_order]));
      
      queryClient.setQueryData(
        ARTICLE_QUERY_KEYS.all(tenantId, blogId),
        (old: any) => {
          if (!old) return old;
          
          // Update display_order for affected articles
          return old.map((article: Article) => {
            const newOrder = orderMap.get(article.id);
            return newOrder !== undefined 
              ? { ...article, display_order: newOrder }
              : article;
          }).sort((a: Article, b: Article) => a.display_order - b.display_order);
        }
      );

      return { previousArticles };
    },
    onError: (error, { blogId }, context) => {
      // Rollback on error
      if (context?.previousArticles) {
        queryClient.setQueryData(
          ARTICLE_QUERY_KEYS.all(tenantId, blogId),
          context.previousArticles
        );
      }
      toast.showError(error, 'Failed to reorder articles');
    },
    onSuccess: (_data, { blogId }) => {
      // Invalidate to ensure we have the latest data from server
      queryClient.invalidateQueries({ 
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId) 
      });
      toast.articlesReordered();
    },
  });
}
