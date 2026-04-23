import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBillingConfigAction } from '@/src/common/actions/payments/create-billing-config';
import type { CreateBillingConfigDto } from '@/src/common/@types/@payments';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useCreateBillingConfig() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateBillingConfigDto) => createBillingConfigAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-config', tenantId] });
    },
  });
}
