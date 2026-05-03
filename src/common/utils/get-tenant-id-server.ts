import { cookies } from 'next/headers';

type TenantStorageSnapshot = {
  state?: {
    selectedTenant?: {
      id?: string | number;
    } | null;
    dashboardScope?: 'tenant' | 'global';
  };
};

/**
 * Extrai o tenant ID do cookie "tenant-storage" no servidor (Server Actions / Route Handlers).
 * Retorna null se não houver tenant selecionado ou se estiver em modo global.
 */
export async function getTenantIdFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tenantCookie = cookieStore.get('tenant-storage')?.value;

    if (!tenantCookie) return null;

    const decoded = decodeURIComponent(tenantCookie);
    const parsed: TenantStorageSnapshot = JSON.parse(decoded);

    if (!parsed || parsed.state?.dashboardScope === 'global') {
      return null;
    }

    const tenantId = parsed.state?.selectedTenant?.id?.toString() ?? null;

    // Validate CUID format (25 chars, starts with 'c')
    if (tenantId && /^c[a-z0-9]{24}$/.test(tenantId)) {
      return tenantId;
    }

    return null;
  } catch {
    return null;
  }
}
