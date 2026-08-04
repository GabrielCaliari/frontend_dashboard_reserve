import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';

export function useSnapshots(clientId: string | null, params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['hotel-portal', 'snapshots', clientId, params],
    queryFn: () => hotelPortalService.getSnapshots(clientId!, params),
    enabled: !!clientId,
  });
}
