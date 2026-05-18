import type { InternalAxiosRequestConfig } from "axios";

type TenantStorageSnapshot = {
  state?: {
    selectedTenant?: {
      id?: string | number;
    } | null;
  };
};

/**
 * Extrai o tenant ID do valor do cookie "tenant-storage" (JSON persistido pelo Zustand).
 */
function parseTenantCookie(cookieValue: string): TenantStorageSnapshot | null {
  try {
    const decoded = decodeURIComponent(cookieValue);
    return JSON.parse(decoded) as TenantStorageSnapshot;
  } catch {
    return null;
  }
}

function extractTenantId(cookieValue: string): string | null {
  const parsed = parseTenantCookie(cookieValue);
  if (!parsed) return null;

  return parsed.state?.selectedTenant?.id?.toString() ?? null;
}

/**
 * Injeta headers de autenticacao (Authorization, session-id, x-tenant-id) no config do axios.
 *
 * O tenant-id e lido do cookie "tenant-storage" (unica fonte de verdade, setado pelo Zustand).
 * Funciona tanto no client quanto no server.
 */
export async function injectAuthHeaders(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const requestConfig = config as InternalAxiosRequestConfig & {
    skipTenantHeader?: boolean;
  };

  if (typeof window !== "undefined") {
    // === CLIENT-SIDE ===
    const getCookie = (name: string) =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")
        .slice(1)
        .join("=") ?? null;

    const token = getCookie("token");
    const sessionId = getCookie("session-code");
    const tenantCookie = getCookie("tenant-storage");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (sessionId) config.headers["session-id"] = sessionId;

    if (!requestConfig.skipTenantHeader && tenantCookie) {
      const tenantId = extractTenantId(tenantCookie);
      // Only send if it looks like a valid alphanumeric ID (supports CUIDv1 and CUIDv2)
      if (tenantId && /^[a-z0-9]{2,32}$/.test(tenantId)) {
        config.headers["x-tenant-id"] = tenantId;
      }
    }
  } else {
    // === SERVER-SIDE (Server Actions / Route Handlers) ===
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();

      const token = cookieStore.get("token")?.value;
      const sessionId = cookieStore.get("session-code")?.value;
      const tenantCookie = cookieStore.get("tenant-storage")?.value;

      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (sessionId) config.headers["session-id"] = sessionId;

      if (!requestConfig.skipTenantHeader && tenantCookie) {
        const tenantId = extractTenantId(tenantCookie);
        // Only send if it looks like a valid alphanumeric ID (supports CUIDv1 and CUIDv2)
        if (tenantId && /^[a-z0-9]{2,32}$/.test(tenantId)) {
          config.headers["x-tenant-id"] = tenantId;
        }
      }
    } catch {
      // Silent fail - cookies may not be available outside request context
    }
  }

  return config;
}
