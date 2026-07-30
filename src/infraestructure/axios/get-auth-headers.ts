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
 * Requests to the client-portal backend (`/portal/**`) authenticate with a
 * separate session (`portal-token` cookie, set by `usePortalAuth` — see
 * `src/modules/portal/presentation/hooks/use-portal-auth.ts`) that is
 * intentionally isolated from the admin `token`/`tenant-storage` cookies so
 * an admin session never grants portal access and vice versa (master doc
 * §4.1, Assumption 2 in the portal frontend plan). Route on `config.url`
 * rather than the browser location, since axios requests can be issued from
 * any page.
 */
function isPortalRequest(url: string | undefined): boolean {
  return typeof url === "string" && url.startsWith("/portal/");
}

/**
 * Injeta headers de autenticacao (Authorization, session-id, x-tenant-id) no config do axios.
 *
 * O tenant-id e lido do cookie "tenant-storage" (unica fonte de verdade, setado pelo Zustand).
 * Funciona tanto no client quanto no server.
 *
 * Requisicoes para `/portal/**` (client-portal) usam o cookie `portal-token`
 * como Bearer em vez do `token` administrativo, e nao enviam `x-tenant-id`
 * (a sessao do portal ja e escopada a um unico tenant pelo backend).
 */
export async function injectAuthHeaders(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  const requestConfig = config as InternalAxiosRequestConfig & {
    skipTenantHeader?: boolean;
  };
  const portalRequest = isPortalRequest(config.url);

  if (typeof window !== "undefined") {
    // === CLIENT-SIDE ===
    const getCookie = (name: string) =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")
        .slice(1)
        .join("=") ?? null;

    if (portalRequest) {
      const portalToken = getCookie("portal-token");
      if (portalToken) config.headers.Authorization = `Bearer ${portalToken}`;
      return config;
    }

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

      if (portalRequest) {
        const portalToken = cookieStore.get("portal-token")?.value;
        if (portalToken) config.headers.Authorization = `Bearer ${portalToken}`;
        return config;
      }

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
