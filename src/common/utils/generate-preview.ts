/**
 * Utilities for generating preview URLs and thumbnails for media assets
 */

export interface PreviewOptions {
  width?: number;
  height?: number;
  quality?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

/**
 * Generates a preview URL for an image asset
 * For Vercel Blob Storage, returns the original URL (optimization handled by Vercel)
 * 
 * @param url - Original asset URL
 * @param options - Preview options (width, height, quality, fit)
 * @returns Preview URL
 */
export function generateImagePreview(
  url: string,
  options: PreviewOptions = {}
): string {
  // Vercel Blob Storage handles image optimization automatically
  // We return the original URL as Vercel will serve optimized versions
  // based on the request headers and device capabilities
  return url;
}

/**
 * Generates a thumbnail URL for an image asset
 * 
 * @param url - Original asset URL
 * @param size - Thumbnail size (default: 200px)
 * @returns Thumbnail URL
 */
export function generateThumbnail(url: string, size: number = 200): string {
  return generateImagePreview(url, {
    width: size,
    height: size,
    fit: 'cover',
  });
}

/**
 * Creates a data URL preview from a File object (for client-side preview before upload)
 * 
 * @param file - File object
 * @returns Promise resolving to data URL
 */
export function createFilePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates multiple file previews from an array of files
 * 
 * @param files - Array of File objects
 * @returns Promise resolving to array of data URLs
 */
export async function createFilePreviews(
  files: File[]
): Promise<Array<{ file: File; preview: string | null }>> {
  const previews = await Promise.allSettled(
    files.map(async (file) => {
      if (!file.type.startsWith('image/')) {
        return { file, preview: null };
      }
      try {
        const preview = await createFilePreview(file);
        return { file, preview };
      } catch {
        return { file, preview: null };
      }
    })
  );

  return previews.map((result) =>
    result.status === 'fulfilled'
      ? result.value
      : { file: files[0], preview: null }
  );
}

/**
 * Revokes object URLs to free memory
 * Call this when preview is no longer needed
 * 
 * @param url - Object URL to revoke
 */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Gets a placeholder icon/image for non-image files
 * 
 * @param mimeType - File MIME type
 * @returns Icon name or placeholder URL
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'file-text';
  if (
    mimeType.includes('document') ||
    mimeType.includes('msword') ||
    mimeType.includes('wordprocessingml')
  )
    return 'file-text';
  if (
    mimeType.includes('sheet') ||
    mimeType.includes('ms-excel') ||
    mimeType.includes('spreadsheetml')
  )
    return 'file-spreadsheet';
  if (mimeType.includes('zip') || mimeType.includes('compressed'))
    return 'file-archive';

  return 'file';
}

/**
 * Extracts image dimensions from a File object
 * 
 * @param file - Image file
 * @returns Promise resolving to dimensions { width, height }
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Formats image dimensions as a string
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns Formatted string (e.g., "1920 × 1080")
 */
export function formatDimensions(
  width: number | undefined,
  height: number | undefined
): string {
  if (!width || !height) return 'Unknown';
  return `${width} × ${height}`;
}

/**
 * Calculates aspect ratio from dimensions
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns Aspect ratio as string (e.g., "16:9", "4:3")
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

/**
 * Checks if an image is landscape orientation
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns True if landscape
 */
export function isLandscape(width: number, height: number): boolean {
  return width > height;
}

/**
 * Checks if an image is portrait orientation
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns True if portrait
 */
export function isPortrait(width: number, height: number): boolean {
  return height > width;
}

/**
 * Checks if an image is square
 * 
 * @param width - Image width
 * @param height - Image height
 * @returns True if square
 */
export function isSquare(width: number, height: number): boolean {
  return width === height;
}
