import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  uploadImages,
  updateImage,
  deleteImage,
  reorderImages,
} from '@/src/common/services/cms-image-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { ARTICLE_QUERY_KEYS } from './useArticles';
import { useCMSToast } from './use-cms-toast';
import type {
  ArticleImage,
  UpdateArticleImageDto,
  ReorderImageDto,
} from '@/src/common/@types/@cms-image';
import type { Article } from '@/src/common/@types/@cms-article';

/**
 * Hook to upload multiple images to an article
 * 
 * Features:
 * - Handles multipart/form-data upload to S3 storage
 * - Associates each image with the article
 * - Generates complete URLs for uploaded images
 * - Invalidates article cache to refresh image data
 * - Supports optional alt text for each image
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const uploadImagesMutation = useUploadImages();
 * 
 * const handleUpload = async (files: File[]) => {
 *   const images = await uploadImagesMutation.mutateAsync({
 *     blogId: 123,
 *     articleId: 456,
 *     files,
 *     altTexts: ['Image 1', 'Image 2']
 *   });
 *   console.log('Uploaded images:', images);
 * };
 * ```
 * 
 * **Validates: Requirements 12.1, 12.2**
 */
export function useUploadImages() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
      files,
      altTexts,
    }: {
      blogId: number;
      articleId: number;
      files: File[];
      altTexts?: (string | null)[];
    }) => uploadImages(blogId, articleId, files, altTexts),
    onSuccess: (data, variables) => {
      // Invalidate article detail query to refresh with new images
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, variables.blogId, variables.articleId),
      });
      
      // Also invalidate article list to update image counts
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, variables.blogId),
      });
      
      toast.imagesUploaded(data.length);
    },
    onError: (error) => {
      toast.showError(error, 'Failed to upload images');
    },
  });
}

/**
 * Hook to update an article image (alt text and/or display order)
 * 
 * Features:
 * - Optimistic updates for immediate UI feedback
 * - Updates alt text for accessibility
 * - Updates display order for image positioning
 * - Rolls back on error
 * - Invalidates cache on success
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const updateImageMutation = useUpdateImage();
 * 
 * const handleUpdateAltText = async (imageId: number) => {
 *   await updateImageMutation.mutateAsync({
 *     blogId: 123,
 *     articleId: 456,
 *     imageId,
 *     data: { alt_text: 'Updated alt text' }
 *   });
 * };
 * ```
 * 
 * **Validates: Requirements 12.3**
 */
export function useUpdateImage() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
      imageId,
      data,
    }: {
      blogId: number;
      articleId: number;
      imageId: number;
      data: UpdateArticleImageDto;
    }) => updateImage(blogId, articleId, imageId, data),
    onMutate: async ({ blogId, articleId, imageId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId)
      );

      // Optimistically update the image in the article's images array
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            images: old.images.map((img) =>
              img.id === imageId ? { ...img, ...data } : img
            ),
          };
        }
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
      toast.showError(error, 'Failed to update image');
    },
    onSuccess: (_data, { blogId, articleId }) => {
      // Invalidate to ensure we have the latest data from server
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });
      toast.imageUpdated();
    },
  });
}

/**
 * Hook to delete an article image
 * 
 * Features:
 * - Removes image record from database
 * - Deletes physical file from S3 storage
 * - Optimistic updates for immediate UI feedback
 * - Rolls back on error
 * - Invalidates cache on success
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const deleteImageMutation = useDeleteImage();
 * 
 * const handleDelete = async (imageId: number) => {
 *   if (confirm('Delete this image?')) {
 *     await deleteImageMutation.mutateAsync({
 *       blogId: 123,
 *       articleId: 456,
 *       imageId
 *     });
 *   }
 * };
 * ```
 * 
 * **Validates: Requirements 12.5**
 */
export function useDeleteImage() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
      imageId,
    }: {
      blogId: number;
      articleId: number;
      imageId: number;
    }) => deleteImage(blogId, articleId, imageId),
    onMutate: async ({ blogId, articleId, imageId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId)
      );

      // Optimistically remove the image from the article's images array
      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
        (old) => {
          if (!old) return old;
          
          return {
            ...old,
            images: old.images.filter((img) => img.id !== imageId),
          };
        }
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
      toast.showError(error, 'Failed to delete image');
    },
    onSuccess: (_data, { blogId, articleId }) => {
      // Invalidate article detail to refresh image data
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });
      
      // Also invalidate article list to update image counts
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.all(tenantId, blogId),
      });
      
      toast.imageDeleted();
    },
  });
}

/**
 * Hook to reorder article images by updating display_order values
 * 
 * Features:
 * - Optimistic updates for immediate drag-and-drop feedback
 * - Updates all images in a single transaction
 * - Does NOT validate uniqueness or sequence of display_order (gaps allowed)
 * - Rolls back on error
 * - Sorts images by display_order after update
 * 
 * @returns Mutation object with mutate/mutateAsync functions
 * 
 * @example
 * ```tsx
 * const reorderImagesMutation = useReorderImages();
 * 
 * const handleReorder = async (newOrder: ReorderImageDto[]) => {
 *   await reorderImagesMutation.mutateAsync({
 *     blogId: 123,
 *     articleId: 456,
 *     order: newOrder
 *   });
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
 * **Validates: Requirements 12.4**
 */
export function useReorderImages() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();
  const toast = useCMSToast();

  return useMutation({
    mutationFn: ({
      blogId,
      articleId,
      order,
    }: {
      blogId: number;
      articleId: number;
      order: ReorderImageDto[];
    }) => reorderImages(blogId, articleId, order),
    onMutate: async ({ blogId, articleId, order }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });

      // Snapshot previous value
      const previousArticle = queryClient.getQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId)
      );

      // Optimistically update the image order
      // Create a map of new display orders
      const orderMap = new Map(order.map((item) => [item.id, item.display_order]));

      queryClient.setQueryData<Article>(
        ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
        (old) => {
          if (!old) return old;

          // Update display_order for affected images
          const updatedImages = old.images.map((img) => {
            const newOrder = orderMap.get(img.id);
            return newOrder !== undefined
              ? { ...img, display_order: newOrder }
              : img;
          });

          // Sort images by display_order
          updatedImages.sort((a, b) => a.display_order - b.display_order);

          return {
            ...old,
            images: updatedImages,
          };
        }
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
      toast.showError(error, 'Failed to reorder images');
    },
    onSuccess: (_data, { blogId, articleId }) => {
      // Invalidate to ensure we have the latest data from server
      queryClient.invalidateQueries({
        queryKey: ARTICLE_QUERY_KEYS.detail(tenantId, blogId, articleId),
      });
      toast.imagesReordered();
    },
  });
}
