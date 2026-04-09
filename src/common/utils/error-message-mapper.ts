/**
 * Maps backend API error codes and messages to user-friendly strings.
 * Used in all mutation onError handlers to provide clear feedback.
 */

const ERROR_MAP: Record<string, string> = {
  // Auth
  INVALID_CREDENTIALS: "Invalid email or password.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  UNAUTHORIZED: "You do not have permission to perform this action.",
  FORBIDDEN: "Access denied.",

  // Admin
  ADMIN_NOT_FOUND: "Admin account not found.",
  ADMIN_ALREADY_EXISTS: "An admin with this email already exists.",
  ADMIN_SELF_DELETE: "You cannot delete your own account.",
  ADMIN_SELF_DEACTIVATE: "You cannot deactivate your own account.",
  ADMIN_INACTIVE: "This admin account is inactive.",

  // User
  USER_NOT_FOUND: "User account not found.",
  USER_ALREADY_EXISTS: "A user with this email already exists.",

  // Tenant
  TENANT_NOT_FOUND: "Tenant not found.",
  TENANT_SLUG_CONFLICT: "A tenant with this slug already exists.",
  TENANT_DOMAIN_CONFLICT: "A tenant with this domain already exists.",

  // Validation
  VALIDATION_ERROR: "Please check the form fields and try again.",
  INVALID_EMAIL: "Please enter a valid email address.",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with one uppercase letter and one digit.",
  INSUFFICIENT_PERMISSIONS_TO_UPDATE_PASSWORD:
    "Only super admins can update admin passwords.",

  // Network / Server
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  INTERNAL_SERVER_ERROR:
    "Something went wrong on our end. Please try again later.",
  SERVICE_UNAVAILABLE:
    "Service temporarily unavailable. Please try again later.",
};

/**
 * Maps a backend error to a human-readable message for toasts and alerts.
 * Falls back to the raw message, or a generic string if nothing matches.
 */
export function mapErrorMessage(
  error: unknown,
  fallback = "Ocorreu um erro inesperado. Tente novamente.",
): string {
  if (!error) return fallback;

  // Axios-style error
  const axiosError = error as {
    response?: {
      status?: number;
      data?: unknown;
      headers?: Record<string, string>;
    };
    message?: string;
  };

  const status = axiosError?.response?.status;
  const data = axiosError?.response?.data;

  // HTML error page (e.g. from proxy / missing x-tenant-id / 400 from express)
  if (typeof data === "string" && data.trim().startsWith("<")) {
    return STATUS_MESSAGE[status ?? 0] ?? fallback;
  }

  const jsonData = data as
    | { code?: string; message?: string | string[] }
    | undefined;
  const code = jsonData?.code;
  const message = jsonData?.message;

  if (code && ERROR_MAP[code]) {
    return ERROR_MAP[code];
  }

  if (Array.isArray(message)) {
    return message.join(" ");
  }

  if (typeof message === "string" && message.length > 0) {
    return message;
  }

  if (status && STATUS_MESSAGE[status]) {
    return STATUS_MESSAGE[status];
  }

  if (
    typeof axiosError?.message === "string" &&
    axiosError.message !== "Network Error"
  ) {
    return axiosError.message;
  }

  if (axiosError?.message === "Network Error") {
    return ERROR_MAP["NETWORK_ERROR"];
  }

  return fallback;
}

/** HTTP status → friendly message fallback */
const STATUS_MESSAGE: Record<number, string> = {
  400: "Requisição inválida. Verifique os dados enviados.",
  401: "Sessão expirada. Faça login novamente.",
  403: "Sem permissão para executar esta ação.",
  404: "Recurso não encontrado.",
  409: "Conflito: este registro já existe.",
  422: "Dados inválidos. Verifique os campos e tente novamente.",
  429: "Muitas tentativas. Aguarde um momento.",
  500: "Erro interno do servidor. Tente novamente em instantes.",
  502: "Serviço indisponível temporariamente.",
  503: "Serviço em manutenção. Tente novamente em breve.",
};
