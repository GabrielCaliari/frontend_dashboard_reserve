import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type { CreateMotorManualReservationDto } from '@/src/shared/domain/types/@motor';

export function useMotorReservations(
  tenantId: string | null,
  params?: { from?: string; to?: string; status?: string; origem?: string },
) {
  return useQuery({
    queryKey: ['motor', 'reservations', tenantId, params],
    queryFn: () => motorService.listReservations(tenantId!, params),
    enabled: !!tenantId,
  });
}

export function useMotorReservation(tenantId: string | null, id: string | null) {
  return useQuery({
    queryKey: ['motor', 'reservations', tenantId, 'detail', id],
    queryFn: () => motorService.getReservation(tenantId!, id!),
    enabled: !!tenantId && !!id,
  });
}

function useInvalidateReservations(tenantId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['motor', 'reservations', tenantId] });
    qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] });
  };
}

export function useCreateManualReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: (dto: CreateMotorManualReservationDto) =>
      motorService.createManualReservation(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useRescheduleReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { novo_checkin: string; novo_checkout: string } }) =>
      motorService.rescheduleReservation(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useCancelReservation(tenantId: string) {
  const invalidate = useInvalidateReservations(tenantId);
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) =>
      motorService.cancelReservation(tenantId, id, { motivo }),
    onSuccess: invalidate,
  });
}
