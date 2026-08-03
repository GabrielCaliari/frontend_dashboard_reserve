import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import usePermissions from '@/src/shared/hooks/use-permissions';
import { useTenantStore } from '@/src/shared/stores/tenant-store';

export function useMyHotelClients() {
  return useQuery({
    queryKey: ['hotel-portal', 'my-clients'],
    queryFn: () => hotelPortalService.getMyClients(),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

/** Returns the first hotel client for the logged-in manager */
export function useMyHotelClient() {
  const query = useMyHotelClients();
  return {
    ...query,
    data: query.data?.[0] ?? undefined,
  };
}

export function useHotelClientByUserId(userId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'by-user', userId],
    queryFn: () => hotelPortalService.getClientByUserId(userId!),
    enabled: !!userId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook unificado: manager → busca próprio HotelClient via /hotel-portal/my-clients
 *                 super_admin → busca pelo tenant selecionado (via x-tenant-id header)
 */
export function useActiveHotelClient() {
  const { isManager, isSuperAdmin } = usePermissions();
  const selectedTenant = useTenantStore((s) => s.selectedTenant);

  const meQuery = useMyHotelClient();
  const tenantQuery = useQuery({
    queryKey: ['hotel-portal', 'current-tenant', selectedTenant?.id],
    queryFn: () => hotelPortalService.getClientForCurrentTenant(),
    enabled: isSuperAdmin && !!selectedTenant,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (isManager) return meQuery;
  return tenantQuery;
}
