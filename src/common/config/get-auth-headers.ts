import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Injeta headers de autenticacao (Authorization, session-id, x-tenant-id) no config do axios.
 *
 * - Client-side: le cookies via document.cookie e tenant via localStorage.
 * - Server-side (Server Actions, Route Handlers): le cookies via next/headers (async).
 *   O tenant-id e passado via cookie "x-tenant-id" (setado pelo tenant-store no client).
 *
 * Usada nos interceptors de todos os API clients (api, cmsApi, apiEmail).
 */
export async function injectAuthHeaders(
  config: InternalAxiosRequestConfig,
): Promise<InternalAxiosRequestConfig> {
  if (typeof window !== 'undefined') {
    // === CLIENT-SIDE ===
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    const sessionId = document.cookie
      .split('; ')
      .find(row => row.startsWith('session-code='))
      ?.split('=')[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (sessionId) {
      config.headers['session-id'] = sessionId;
    }

    try {
      const tenantStorage = localStorage.getItem('tenant-storage');
      if (tenantStorage) {
        const { state } = JSON.parse(tenantStorage);
        if (state?.selectedTenant?.id) {
          config.headers['x-tenant-id'] = state.selectedTenant.id.toString();
        }
      }
    } catch {
      // Silent fail - tenant header is optional for some endpoints
    }
  } else {
    // === SERVER-SIDE (Server Actions / Route Handlers) ===
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();

      const token = cookieStore.get('token')?.value;
      const sessionId = cookieStore.get('session-code')?.value;
      const tenantId = cookieStore.get('x-tenant-id')?.value;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (sessionId) {
        config.headers['session-id'] = sessionId;
      }

      if (tenantId) {
        config.headers['x-tenant-id'] = tenantId;
      }
    } catch {
      // Fora de contexto de request (ex: build time) - silent fail
    }
  }

  return config;
}
