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
 * True when the failed request targeted the client-portal backend
 * (`/portal/**`), which authenticates with its own `portal-token` session
 * (see `src/infraestructure/axios/get-auth-headers.ts`) and must never be
 * redirected to the admin login nor have its admin cookies cleared —
 * the two sessions are intentionally isolated (master doc §4.1).
 */
export const isPortalRequestError = (error: unknown): boolean => {
  const url = (error as { config?: { url?: string } } | undefined)?.config?.url;
  return typeof url === "string" && url.startsWith("/portal/");
};

/**
 * Clear the portal session cookies and redirect to the portal login page.
 * Mirrors `handleUnauthorizedError` but scoped to the client-portal session
 * (`portal-token` / `portal-session-*`) instead of the admin one.
 */
export const handlePortalUnauthorizedError = (): void => {
  if (typeof window !== "undefined") {
    document.cookie = "portal-token=; Max-Age=0; path=/;";
    document.cookie = "portal-session-role=; Max-Age=0; path=/;";
    document.cookie = "portal-session-name=; Max-Age=0; path=/;";
    document.cookie = "portal-session-email=; Max-Age=0; path=/;";
    document.cookie = "portal-session-tenant=; Max-Age=0; path=/;";

    window.location.href = "/portal/login";
  }
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
