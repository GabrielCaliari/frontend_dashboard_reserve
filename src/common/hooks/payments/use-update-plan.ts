import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updatePlanAction } from '@/src/common/actions/payments/update-plan';
import type { UpdateStripePlanDto } from '@/src/common/@types/@payments';

export function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStripePlanDto }) =>
      updatePlanAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans-admin'] });
    },
  });
}
