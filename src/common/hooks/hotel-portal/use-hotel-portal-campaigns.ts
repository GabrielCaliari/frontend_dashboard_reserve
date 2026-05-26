import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/common/services/hotel-portal-service';

export function useHotelPortalCampaigns(
  clientId: string | null,
  params?: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: ['hotel-portal', 'campaigns', clientId, params?.from, params?.to],
    queryFn: () => hotelPortalService.getCampaigns(clientId!, params),
    enabled: !!clientId,
  });
}
