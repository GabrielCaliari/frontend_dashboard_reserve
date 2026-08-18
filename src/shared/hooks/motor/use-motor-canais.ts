import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type { ConnectMotorCanalDto } from '@/src/shared/domain/types/@motor';

// Hooks da tela de canais (Beds24). Mesma regra dos demais hooks do motor:
// tenantId explicito, query desabilitada enquanto ele for nulo.

export function useMotorCanais(tenantId: string | null) {
  return useQuery({
    queryKey: ['motor', 'canais', tenantId],
    queryFn: () => motorService.getCanais(tenantId!),
    enabled: !!tenantId,
  });
}

function useInvalidateCanais(tenantId: string) {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['motor', 'canais', tenantId] });
}

export function useConnectCanal(tenantId: string) {
  const invalidate = useInvalidateCanais(tenantId);
  return useMutation({
    mutationFn: (dto: ConnectMotorCanalDto) => motorService.connectCanal(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useSaveRoomMap(tenantId: string) {
  const invalidate = useInvalidateCanais(tenantId);
  return useMutation({
    mutationFn: (map: Record<string, number>) => motorService.saveCanalRoomMap(tenantId, map),
    onSuccess: invalidate,
  });
}

export function useSetReconcile2x(tenantId: string) {
  const invalidate = useInvalidateCanais(tenantId);
  return useMutation({
    mutationFn: (enabled: boolean) => motorService.setCanalReconcile2x(tenantId, enabled),
    onSuccess: invalidate,
  });
}

export function useReconcileNow(tenantId: string) {
  const invalidate = useInvalidateCanais(tenantId);
  return useMutation({
    mutationFn: () => motorService.reconcileCanalNow(tenantId),
    onSuccess: invalidate,
  });
}
