/**
 * Access Management Error Constants and Utilities
 *
 * This file contains error codes, messages, and utility functions for handling
 * errors in the access management feature.
 */

import { AxiosError } from "axios";
import { ApiErrorResponse } from "@/src/shared/domain/types/@access-management";

// ============================================================================
// Error Constants
// ============================================================================

/**
 * Error codes for access management operations
 * Format: CATEGORY_SPECIFIC_ERROR
 */
export const ACCESS_MANAGEMENT_ERRORS = {
  // Admin errors
  ADMIN_NOT_FOUND: "ADMIN_NOT_FOUND",
  ADMIN_EMAIL_DUPLICATE: "ADMIN_EMAIL_DUPLICATE",
  ADMIN_SELF_DEACTIVATE: "ADMIN_SELF_DEACTIVATE",
  ADMIN_SELF_DELETE: "ADMIN_SELF_DELETE",
  ADMIN_CREATE_FAILED: "ADMIN_CREATE_FAILED",
  ADMIN_UPDATE_FAILED: "ADMIN_UPDATE_FAILED",
  ADMIN_DELETE_FAILED: "ADMIN_DELETE_FAILED",

  // Tenant errors
  TENANT_NOT_FOUND: "TENANT_NOT_FOUND",
  TENANT_SLUG_DUPLICATE: "TENANT_SLUG_DUPLICATE",
  TENANT_CREATE_FAILED: "TENANT_CREATE_FAILED",
  TENANT_UPDATE_FAILED: "TENANT_UPDATE_FAILED",
  TENANT_DELETE_FAILED: "TENANT_DELETE_FAILED",

  // User errors
  USER_NOT_FOUND: "USER_NOT_FOUND",
  USER_EMAIL_DUPLICATE: "USER_EMAIL_DUPLICATE",
  USER_UPDATE_FAILED: "USER_UPDATE_FAILED",
  USER_DELETE_FAILED: "USER_DELETE_FAILED",

  // Admin-Tenant relationship errors
  ADMIN_ALREADY_ASSIGNED: "ADMIN_ALREADY_ASSIGNED",
  ADMIN_NOT_ASSIGNED: "ADMIN_NOT_ASSIGNED",
  ASSIGN_ADMIN_FAILED: "ASSIGN_ADMIN_FAILED",
  REMOVE_ADMIN_FAILED: "REMOVE_ADMIN_FAILED",
  UPDATE_ROLE_FAILED: "UPDATE_ROLE_FAILED",

  // Network and generic errors
  NETWORK_ERROR: "NETWORK_ERROR",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Admin messages
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_NOT_FOUND]: "Admin not found",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_EMAIL_DUPLICATE]:
    "An admin with this email already exists",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_SELF_DEACTIVATE]:
    "You cannot deactivate your own account",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_SELF_DELETE]:
    "You cannot delete your own account",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_CREATE_FAILED]: "Failed to create admin",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_UPDATE_FAILED]: "Failed to update admin",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_DELETE_FAILED]: "Failed to delete admin",

  // Tenant messages
  [ACCESS_MANAGEMENT_ERRORS.TENANT_NOT_FOUND]: "Tenant not found",
  [ACCESS_MANAGEMENT_ERRORS.TENANT_SLUG_DUPLICATE]:
    "A tenant with this slug already exists",
  [ACCESS_MANAGEMENT_ERRORS.TENANT_CREATE_FAILED]: "Failed to create tenant",
  [ACCESS_MANAGEMENT_ERRORS.TENANT_UPDATE_FAILED]: "Failed to update tenant",
  [ACCESS_MANAGEMENT_ERRORS.TENANT_DELETE_FAILED]: "Failed to delete tenant",

  // User messages
  [ACCESS_MANAGEMENT_ERRORS.USER_NOT_FOUND]: "User not found",
  [ACCESS_MANAGEMENT_ERRORS.USER_EMAIL_DUPLICATE]:
    "A user with this email already exists",
  [ACCESS_MANAGEMENT_ERRORS.USER_UPDATE_FAILED]: "Failed to update user",
  [ACCESS_MANAGEMENT_ERRORS.USER_DELETE_FAILED]: "Failed to delete user",

  // Admin-Tenant relationship messages
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_ALREADY_ASSIGNED]:
    "This admin is already assigned to this tenant",
  [ACCESS_MANAGEMENT_ERRORS.ADMIN_NOT_ASSIGNED]:
    "This admin is not assigned to this tenant",
  [ACCESS_MANAGEMENT_ERRORS.ASSIGN_ADMIN_FAILED]:
    "Failed to assign admin to tenant",
  [ACCESS_MANAGEMENT_ERRORS.REMOVE_ADMIN_FAILED]:
    "Failed to remove admin from tenant",
  [ACCESS_MANAGEMENT_ERRORS.UPDATE_ROLE_FAILED]: "Failed to update admin role",

  // Network and generic messages
  [ACCESS_MANAGEMENT_ERRORS.NETWORK_ERROR]:
    "Network error. Please check your connection and try again.",
  [ACCESS_MANAGEMENT_ERRORS.VALIDATION_ERROR]:
    "Please check your input and try again",
  [ACCESS_MANAGEMENT_ERRORS.UNAUTHORIZED]:
    "You are not authorized. Please log in again.",
  [ACCESS_MANAGEMENT_ERRORS.FORBIDDEN]:
    "You do not have permission to perform this action",
  [ACCESS_MANAGEMENT_ERRORS.INTERNAL_SERVER_ERROR]:
    "An unexpected error occurred. Please try again later.",
};

// ============================================================================
// Error Utility Functions
// ============================================================================

/**
 * Extracts error message from Axios error response
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;

    // Return API error message if available
    if (apiError?.message) {
      return apiError.message;
    }

    // Return mapped error message based on status code
    if (error.response?.status === 404) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.ADMIN_NOT_FOUND];
    }

    if (error.response?.status === 409) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.ADMIN_EMAIL_DUPLICATE];
    }

    if (error.response?.status === 401) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.UNAUTHORIZED];
    }

    if (error.response?.status === 403) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.FORBIDDEN];
    }

    if (error.response?.status === 500) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.INTERNAL_SERVER_ERROR];
    }

    // Network error
    if (!error.response) {
      return ERROR_MESSAGES[ACCESS_MANAGEMENT_ERRORS.NETWORK_ERROR];
    }
  }

  // Fallback for unknown errors
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Extracts validation errors from API response
 */
export function getValidationErrors(
  error: unknown,
): Record<string, string> | null {
  if (error instanceof AxiosError) {
    const apiError = error.response?.data as ApiErrorResponse | undefined;

    if (apiError?.details) {
      // Convert array of messages to single string per field
      const validationErrors: Record<string, string> = {};

      Object.entries(apiError.details).forEach(([field, messages]) => {
        validationErrors[field] = messages[0]; // Take first error message
      });

      return validationErrors;
    }
  }

  return null;
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response && error.code === "ERR_NETWORK";
  }
  return false;
}

/**
 * Checks if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 400;
  }
  return false;
}

/**
 * Checks if error is a conflict error (409)
 */
export function isConflictError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 409;
  }
  return false;
}

/**
 * Checks if error is a not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 404;
  }
  return false;
}

/**
 * Checks if error is an authorization error (401 or 403)
 */
export function isAuthorizationError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401 || error.response?.status === 403;
  }
  return false;
}
