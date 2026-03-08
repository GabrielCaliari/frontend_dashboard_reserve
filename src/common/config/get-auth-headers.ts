import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Extrai o tenant ID do valor do cookie "tenant-storage" (JSON persistido pelo Zustand).
 */
function extractTenantId(cookieValue: string): string | null {
  try {
    const decoded = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(decoded);
    return parsed?.state?.selectedTenant?.id?.toString() ?? null;
  } catch {
    return null;
  }
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
  if (typeof window !== 'undefined') {
    // === CLIENT-SIDE ===
    const getCookie = (name: string) =>
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=') ?? null;

    const token = getCookie('token');
    const sessionId = getCookie('session-code');
    const tenantCookie = getCookie('tenant-storage');

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (sessionId) config.headers['session-id'] = sessionId;

    if (tenantCookie) {
      const tenantId = extractTenantId(tenantCookie);
      if (tenantId) config.headers['x-tenant-id'] = tenantId;
    }
  } else {
    // === SERVER-SIDE (Server Actions / Route Handlers) ===
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();

      const token = cookieStore.get('token')?.value;
      const sessionId = cookieStore.get('session-code')?.value;
      const tenantCookie = cookieStore.get('tenant-storage')?.value;

      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (sessionId) config.headers['session-id'] = sessionId;

      if (tenantCookie) {
        const tenantId = extractTenantId(tenantCookie);
        if (tenantId) config.headers['x-tenant-id'] = tenantId;
      }
    } catch {
      // Silent fail - cookies may not be available outside request context
    }
  }

  return config;
}
