import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type { CreateMotorBlockDto } from '@/src/shared/domain/types/@motor';

export function useMotorCalendar(tenantId: string | null, mes: string) {
  return useQuery({
    queryKey: ['motor', 'calendar', tenantId, mes],
    queryFn: () => motorService.getCalendar(tenantId!, mes),
    enabled: !!tenantId && /^\d{4}-\d{2}$/.test(mes),
  });
}

export function useCreateBlock(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateMotorBlockDto) => motorService.createBlock(tenantId, dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] }),
  });
}

export function useDeleteBlock(tenantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => motorService.deleteBlock(tenantId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['motor', 'calendar', tenantId] }),
  });
}
