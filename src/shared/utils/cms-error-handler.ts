import { AxiosError } from "axios";

/**
 * CMS Error Types
 * Maps API error codes to user-friendly messages
 */
export const CMS_ERROR_MESSAGES = {
  // Blog errors
  BLOG_NOT_FOUND: "Blog not found. It may have been deleted.",
  BLOG_CREATE_FAILED: "Failed to create blog. Please try again.",
  BLOG_UPDATE_FAILED: "Failed to update blog. Please try again.",
  BLOG_DELETE_FAILED: "Failed to delete blog. Please try again.",
  BLOG_KEY_REGENERATE_FAILED:
    "Failed to regenerate secret key. Please try again.",
  BLOG_SLUG_EXISTS: "A blog with this name already exists.",

  // Article errors
  ARTICLE_NOT_FOUND: "Article not found. It may have been deleted.",
  ARTICLE_CREATE_FAILED: "Failed to create article. Please try again.",
  ARTICLE_UPDATE_FAILED: "Failed to update article. Please try again.",
  ARTICLE_DELETE_FAILED: "Failed to delete article. Please try again.",
  ARTICLE_PUBLISH_FAILED: "Failed to publish article. Please try again.",
  ARTICLE_ARCHIVE_FAILED: "Failed to archive article. Please try again.",
  ARTICLE_SLUG_EXISTS: "An article with this title already exists.",
  ARTICLE_INVALID_STATUS_TRANSITION:
    "Invalid status transition. Articles can only be published from draft status and archived from published status.",

  // Image errors
  IMAGE_UPLOAD_FAILED: "Failed to upload image. Please try again.",
  IMAGE_DELETE_FAILED: "Failed to delete image. Please try again.",
  IMAGE_UPDATE_FAILED: "Failed to update image. Please try again.",
  IMAGE_REORDER_FAILED: "Failed to reorder images. Please try again.",
  IMAGE_TOO_LARGE: "Image file is too large. Maximum size is 5MB.",
  IMAGE_INVALID_TYPE:
    "Invalid image type. Only JPEG, PNG, and WebP are supported.",

  // Public API errors
  PUBLIC_ARTICLES_FETCH_FAILED: "Failed to load articles. Please try again.",
  PUBLIC_ARTICLE_NOT_FOUND: "Article not found or not published.",
  PUBLIC_INVALID_SECRET_KEY: "Invalid blog credentials.",

  // Authentication errors
  UNAUTHORIZED:
    "You are not authorized to perform this action. Please log in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  TENANT_MISMATCH: "This resource does not belong to your organization.",

  // Validation errors
  VALIDATION_ERROR: "Please check your input and try again.",
  INVALID_BLOG_NAME: "Blog name must be between 1 and 150 characters.",
  INVALID_ARTICLE_TITLE: "Article title must be between 1 and 255 characters.",
  INVALID_CONTENT: "Article content is required.",

  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TIMEOUT_ERROR: "Request timed out. Please try again.",
  SERVER_ERROR: "Server error. Please try again later.",

  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
} as const;

/**
 * CMS Error class with additional context
 */
export class CMSError extends Error {
  constructor(
    public code: keyof typeof CMS_ERROR_MESSAGES,
    public statusCode?: number,
    public originalError?: unknown,
  ) {
    super(CMS_ERROR_MESSAGES[code]);
    this.name = "CMSError";
  }
}

/**
 * Transform axios error to user-friendly CMS error
 */
export function transformCMSError(error: unknown): CMSError {
  if (error instanceof CMSError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const errorCode = error.response?.data?.code;
    const errorMessage = error.response?.data?.message;

    // Handle specific HTTP status codes
    switch (statusCode) {
      case 401:
        return new CMSError("UNAUTHORIZED", 401, error);

      case 403:
        return new CMSError("FORBIDDEN", 403, error);

      case 404:
        // Determine if it's a blog or article based on URL
        if (error.config?.url?.includes("/articles/")) {
          return new CMSError("ARTICLE_NOT_FOUND", 404, error);
        } else if (error.config?.url?.includes("/blogs/")) {
          return new CMSError("BLOG_NOT_FOUND", 404, error);
        }
        return new CMSError("ARTICLE_NOT_FOUND", 404, error);

      case 409:
        // Conflict - likely status transition error or duplicate slug
        if (
          errorMessage?.includes("status") ||
          errorMessage?.includes("transition")
        ) {
          return new CMSError("ARTICLE_INVALID_STATUS_TRANSITION", 409, error);
        }
        if (
          errorMessage?.includes("slug") ||
          errorMessage?.includes("exists")
        ) {
          if (error.config?.url?.includes("/articles")) {
            return new CMSError("ARTICLE_SLUG_EXISTS", 409, error);
          }
          return new CMSError("BLOG_SLUG_EXISTS", 409, error);
        }
        return new CMSError("VALIDATION_ERROR", 409, error);

      case 422:
        // Validation error
        return new CMSError("VALIDATION_ERROR", 422, error);

      case 500:
      case 502:
      case 503:
        return new CMSError("SERVER_ERROR", statusCode, error);

      default:
        // Network errors
        if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
          return new CMSError("TIMEOUT_ERROR", undefined, error);
        }
        if (!error.response) {
          return new CMSError("NETWORK_ERROR", undefined, error);
        }
    }
  }

  // Unknown error
  return new CMSError("UNKNOWN_ERROR", undefined, error);
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Execute an async function with retry logic
 * @param fn - The async function to execute
 * @param config - Retry configuration
 * @returns Promise with the result or throws CMSError
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {},
): Promise<T> {
  const { maxRetries, retryDelay, retryableStatuses } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Check if error is retryable
      if (error instanceof AxiosError) {
        const statusCode = error.response?.status;

        // Don't retry client errors (except specific ones)
        if (statusCode && !retryableStatuses.includes(statusCode)) {
          break;
        }
      }

      // Wait before retrying with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed, transform and throw error
  throw transformCMSError(lastError);
}

/**
 * Check if an error is a specific CMS error type
 */
export function isCMSError(
  error: unknown,
  code?: keyof typeof CMS_ERROR_MESSAGES,
): boolean {
  if (!(error instanceof CMSError)) {
    return false;
  }

  if (code) {
    return error.code === code;
  }

  return true;
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof CMSError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return CMS_ERROR_MESSAGES.UNKNOWN_ERROR;
}
