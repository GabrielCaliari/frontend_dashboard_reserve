/**
 * Maps backend API error codes and messages to user-friendly strings.
 * Used in all mutation onError handlers to provide clear feedback.
 */

const ERROR_MAP: Record<string, string> = {
  // Auth
  'INVALID_CREDENTIALS':          'Invalid email or password.',
  'SESSION_EXPIRED':              'Your session has expired. Please log in again.',
  'UNAUTHORIZED':                 'You do not have permission to perform this action.',
  'FORBIDDEN':                    'Access denied.',

  // Admin
  'ADMIN_NOT_FOUND':              'Admin account not found.',
  'ADMIN_ALREADY_EXISTS':         'An admin with this email already exists.',
  'ADMIN_SELF_DELETE':            'You cannot delete your own account.',
  'ADMIN_SELF_DEACTIVATE':        'You cannot deactivate your own account.',
  'ADMIN_INACTIVE':               'This admin account is inactive.',

  // User
  'USER_NOT_FOUND':               'User account not found.',
  'USER_ALREADY_EXISTS':          'A user with this email already exists.',

  // Tenant
  'TENANT_NOT_FOUND':             'Tenant not found.',
  'TENANT_SLUG_CONFLICT':         'A tenant with this slug already exists.',
  'TENANT_DOMAIN_CONFLICT':       'A tenant with this domain already exists.',

  // Validation
  'VALIDATION_ERROR':             'Please check the form fields and try again.',
  'INVALID_EMAIL':                'Please enter a valid email address.',
  'WEAK_PASSWORD':                'Password must be at least 8 characters with one uppercase letter and one digit.',

  // Network / Server
  'NETWORK_ERROR':                'Network error. Please check your connection and try again.',
  'INTERNAL_SERVER_ERROR':        'Something went wrong on our end. Please try again later.',
  'SERVICE_UNAVAILABLE':          'Service temporarily unavailable. Please try again later.',
};

/**
 * Maps a backend error to a human-readable message for toasts and alerts.
 * Falls back to the raw message, or a generic string if nothing matches.
 */
export function mapErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred. Please try again.',
): string {
  if (!error) return fallback;

  // Axios-style error
  const axiosError = error as {
    response?: { data?: { code?: string; message?: string | string[] } };
    message?: string;
  };

  const code    = axiosError?.response?.data?.code;
  const message = axiosError?.response?.data?.message;

  if (code && ERROR_MAP[code]) {
    return ERROR_MAP[code];
  }

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  if (typeof axiosError?.message === 'string' && axiosError.message !== 'Network Error') {
    return axiosError.message;
  }

  if (axiosError?.message === 'Network Error') {
    return ERROR_MAP['NETWORK_ERROR'];
  }

  return fallback;
}
