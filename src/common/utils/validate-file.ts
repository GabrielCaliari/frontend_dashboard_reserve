/**
 * File validation utilities for client-side checks
 * Validates files against collection rules before upload
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
}

export interface FileValidationRules {
  allowedMimeTypes?: string[];
  maxFileSize?: number; // bytes
  maxItems?: number;
  currentItemCount?: number;
}

/**
 * Validates a file against collection rules
 * 
 * @param file - File to validate
 * @param rules - Validation rules from collection
 * @returns Validation result with error details if invalid
 */
export function validateFile(
  file: File,
  rules: FileValidationRules
): FileValidationResult {
  // Check file size
  if (rules.maxFileSize && file.size > rules.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatBytes(rules.maxFileSize)}`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // Check MIME type
  if (rules.allowedMimeTypes && rules.allowedMimeTypes.length > 0) {
    const isAllowed = rules.allowedMimeTypes.some((mimeType) =>
      matchMimeType(file.type, mimeType)
    );

    if (!isAllowed) {
      return {
        valid: false,
        error: `File type "${file.type}" is not allowed. Allowed types: ${rules.allowedMimeTypes.join(', ')}`,
        errorCode: 'INVALID_MIME_TYPE',
      };
    }
  }

  // Check max items limit
  if (
    rules.maxItems !== undefined &&
    rules.currentItemCount !== undefined &&
    rules.currentItemCount >= rules.maxItems
  ) {
    return {
      valid: false,
      error: `Collection has reached maximum capacity of ${rules.maxItems} items`,
      errorCode: 'MAX_ITEMS_REACHED',
    };
  }

  return { valid: true };
}

/**
 * Validates multiple files against collection rules
 * 
 * @param files - Files to validate
 * @param rules - Validation rules from collection
 * @returns Array of validation results for each file
 */
export function validateFiles(
  files: File[],
  rules: FileValidationRules
): Array<FileValidationResult & { file: File }> {
  return files.map((file) => ({
    file,
    ...validateFile(file, rules),
  }));
}

/**
 * Matches a file MIME type against a pattern
 * Supports wildcards (e.g., "image/*")
 * 
 * @param fileMimeType - Actual file MIME type
 * @param pattern - Pattern to match (can include wildcards)
 * @returns True if matches
 */
function matchMimeType(fileMimeType: string, pattern: string): boolean {
  if (pattern === '*/*') return true;
  if (pattern === fileMimeType) return true;

  // Handle wildcard patterns like "image/*"
  if (pattern.endsWith('/*')) {
    const baseType = pattern.slice(0, -2);
    return fileMimeType.startsWith(baseType + '/');
  }

  return false;
}

/**
 * Helper to format bytes (duplicated from format-file-size for independence)
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Common MIME type constants for validation
 */
export const MIME_TYPES = {
  // Images
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_GIF: 'image/gif',
  IMAGE_WEBP: 'image/webp',
  IMAGE_SVG: 'image/svg+xml',
  IMAGE_ALL: 'image/*',

  // Documents
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Videos
  VIDEO_MP4: 'video/mp4',
  VIDEO_WEBM: 'video/webm',
  VIDEO_ALL: 'video/*',

  // Audio
  AUDIO_MP3: 'audio/mpeg',
  AUDIO_WAV: 'audio/wav',
  AUDIO_ALL: 'audio/*',
} as const;

/**
 * Predefined MIME type groups for common collection types
 */
export const MIME_TYPE_GROUPS = {
  image: [
    MIME_TYPES.IMAGE_JPEG,
    MIME_TYPES.IMAGE_PNG,
    MIME_TYPES.IMAGE_GIF,
    MIME_TYPES.IMAGE_WEBP,
    MIME_TYPES.IMAGE_SVG,
  ],
  document: [
    MIME_TYPES.PDF,
    MIME_TYPES.DOC,
    MIME_TYPES.DOCX,
    MIME_TYPES.XLS,
    MIME_TYPES.XLSX,
  ],
  video: [MIME_TYPES.VIDEO_MP4, MIME_TYPES.VIDEO_WEBM],
  audio: [MIME_TYPES.AUDIO_MP3, MIME_TYPES.AUDIO_WAV],
  mixed: ['*/*'],
} as const;

/**
 * Gets file extension from filename
 * 
 * @param filename - File name
 * @returns Extension without dot, or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.slice(lastDot + 1).toLowerCase() : '';
}

/**
 * Checks if a file is an image based on MIME type
 * 
 * @param mimeType - File MIME type
 * @returns True if image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Checks if a file is a video based on MIME type
 * 
 * @param mimeType - File MIME type
 * @returns True if video
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/**
 * Checks if a file is a document based on MIME type
 * 
 * @param mimeType - File MIME type
 * @returns True if document
 */
export function isDocumentFile(mimeType: string): boolean {
  return (
    mimeType === 'application/pdf' ||
    mimeType.includes('document') ||
    mimeType.includes('sheet') ||
    mimeType.includes('msword') ||
    mimeType.includes('ms-excel')
  );
}
