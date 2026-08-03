import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { CreateReservationDto } from '@/src/shared/domain/types/@hotel-portal';

export function useReservations(tenantId: string | null, params?: { from?: string; to?: string; status?: string }) {
  return useQuery({
    queryKey: ['hotel-portal', 'reservations', tenantId, params],
    queryFn: () => hotelPortalService.listReservations(tenantId!, params),
    enabled: !!tenantId,
  });
}

export function useReservationStats(tenantId: string | null, params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['hotel-portal', 'reservations', 'stats', tenantId, params],
    queryFn: () => hotelPortalService.getReservationStats(tenantId!, params),
    enabled: !!tenantId,
  });
}

export function useCreateReservation(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationDto) => hotelPortalService.createReservation(tenantId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'reservations', tenantId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'reservations', 'stats', tenantId] });
    },
  });
}
