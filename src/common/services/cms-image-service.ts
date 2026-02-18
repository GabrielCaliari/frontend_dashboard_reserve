import cmsApiClient from '@/src/common/config/cms-api-client';
import {
  ArticleImage,
  UpdateArticleImageDto,
  ReorderImageDto,
} from '@/common/@types/@cms-image';
import { transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * Upload multiple images to an article
 * 
 * This function handles multipart/form-data upload to S3 storage.
 * Each image is associated with the article and generates a complete URL.
 * 
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @param files - Array of image files to upload
 * @param altTexts - Optional array of alt texts corresponding to each file
 * @returns Promise<ArticleImage[]> - Array of created image records
 * 
 * @example
 * const images = await uploadImages(123, 456, [file1, file2], ['Alt 1', 'Alt 2']);
 * console.log(images[0].url);
 * 
 * **Validates: Requirements 12.1, 12.2**
 */
export const uploadImages = async (
  blogId: number,
  articleId: number,
  files: File[],
  altTexts?: (string | null)[]
): Promise<ArticleImage[]> => {
  try {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('images', file);
      if (altTexts && altTexts[index]) {
        formData.append(`alt_text_${index}`, altTexts[index] || '');
      }
    });

    const response = await cmsApiClient.post(
      `/blogs/${blogId}/articles/${articleId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an article image (alt text and/or display order)
 * 
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @param imageId - The image ID
 * @param data - Update data (alt_text and/or display_order)
 * @returns Promise<ArticleImage> - Updated image record
 * 
 * @example
 * const updatedImage = await updateImage(123, 456, 789, { alt_text: 'New alt text' });
 * 
 * **Validates: Requirements 12.3**
 */
export const updateImage = async (
  blogId: number,
  articleId: number,
  imageId: number,
  data: UpdateArticleImageDto
): Promise<ArticleImage> => {
  try {
    const response = await cmsApiClient.put(
      `/blogs/${blogId}/articles/${articleId}/images/${imageId}`,
      data
    );
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an article image
 * 
 * This function removes the image record from the database and
 * deletes the physical file from S3 storage.
 * 
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @param imageId - The image ID
 * @returns Promise<void>
 * 
 * @example
 * await deleteImage(123, 456, 789);
 * 
 * **Validates: Requirements 12.5**
 */
export const deleteImage = async (
  blogId: number,
  articleId: number,
  imageId: number
): Promise<void> => {
  try {
    await cmsApiClient.delete(
      `/blogs/${blogId}/articles/${articleId}/images/${imageId}`
    );
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Reorder article images by updating display_order values
 * 
 * This function updates multiple images in a single transaction.
 * Display order values do not need to be sequential (gaps are allowed).
 * 
 * @param blogId - The blog ID
 * @param articleId - The article ID
 * @param order - Array of image IDs with new display_order values
 * @returns Promise<void>
 * 
 * @example
 * await reorderImages(123, 456, [
 *   { id: 1, display_order: 0 },
 *   { id: 2, display_order: 1 },
 *   { id: 3, display_order: 2 },
 * ]);
 * 
 * **Validates: Requirements 12.4**
 */
export const reorderImages = async (
  blogId: number,
  articleId: number,
  order: ReorderImageDto[]
): Promise<void> => {
  try {
    await cmsApiClient.put(
      `/blogs/${blogId}/articles/${articleId}/images/reorder`,
      { order }
    );
  } catch (error) {
    throw transformCMSError(error);
  }
};
