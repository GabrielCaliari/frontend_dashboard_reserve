/**
 * Centralized authentication error handler
 * Handles 401 errors by clearing auth state and redirecting to login
 */

/**
 * Check if an error is a 401 Unauthorized error
 */
export const isUnauthorizedError = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object" &&
    (error as any).response?.status === 401
  );
};

/**
 * Clear authentication cookies and redirect to login page
 * Should only be called when a 401 error is truly unrecoverable
 */
export const handleUnauthorizedError = (): void => {
  if (typeof window !== "undefined") {
    // Clear all auth-related cookies
    document.cookie = "token=; Max-Age=0; path=/;";
    document.cookie = "session-code=; Max-Age=0; path=/;";
    document.cookie = "session-name=; Max-Age=0; path=/;";

    // Redirect to login page
    window.location.href = "/auth/login";
  }
};

/**
 * Handle API errors with optional 401 redirect
 * Use this in catch blocks where you want to handle 401 errors
 *
 * @param error - The error from the API call
 * @param redirectOn401 - Whether to redirect on 401 (default: false)
 * @returns The error to be re-thrown or handled by caller
 *
 * @example
 * try {
 *   await apiCall();
 * } catch (error) {
 *   handleApiError(error, true); // Will redirect on 401
 *   throw error; // Re-throw for caller to handle
 * }
 */
export const handleApiError = (error: unknown, redirectOn401 = false): void => {
  if (redirectOn401 && isUnauthorizedError(error)) {
    handleUnauthorizedError();
  }
};
