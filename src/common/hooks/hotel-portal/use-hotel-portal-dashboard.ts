import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/common/services/hotel-portal-service';

export function useHotelPortalDashboard(
  clientId: string | null,
  params?: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: ['hotel-portal', 'dashboard', clientId, params?.from, params?.to],
    queryFn: () => hotelPortalService.getDashboard(clientId!, params),
    enabled: !!clientId,
  });
}
