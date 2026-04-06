import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/common/services/hotel-portal-service';

export function useHotelPortalSite(
  clientId: string | null,
  params?: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: ['hotel-portal', 'site-metrics', clientId, params?.from, params?.to],
    queryFn: () => hotelPortalService.getSiteMetrics(clientId!, params),
    enabled: !!clientId,
  });
}
