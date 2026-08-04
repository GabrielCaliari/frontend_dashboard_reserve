import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { Period } from '@/src/shared/domain/types/@hotel-portal-v1';

/**
 * Overview consolidado do gerente (contrato §3 — GET /overview).
 * Devolve KPI já calculado pelo backend. O front nunca agrega.
 */
export function useHotelPortalOverview(
  clientId: string | null,
  period: Period,
) {
  return useQuery({
    queryKey: ['hotel-portal', 'overview', clientId, period.from, period.to],
    queryFn: () =>
      hotelPortalService.getOverview(clientId!, {
        from: period.from,
        to: period.to,
      }),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
