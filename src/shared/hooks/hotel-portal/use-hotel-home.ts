import { useQuery } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { Period } from '@/src/shared/domain/types/@hotel-portal-v1';

/**
 * Home consolidada do Painel: funil do bot + metricas do motor de reservas
 * na mesma tela (GET /hotel-portal/:clientId/home).
 */
export function useHotelHome(clientId: string | null, period: Period) {
  return useQuery({
    queryKey: ['hotel-portal', 'home', clientId, period.from, period.to],
    queryFn: () => hotelPortalService.getHome(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}
