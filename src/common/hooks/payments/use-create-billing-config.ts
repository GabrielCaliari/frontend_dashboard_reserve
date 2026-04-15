import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBillingConfigAction } from "@/src/presentation/actions/payments/create-billing-config";
import type { CreateBillingConfigDto } from "@/src/shared/domain/types/@payments";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useCreateBillingConfig() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateBillingConfigDto) =>
      createBillingConfigAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-config", tenantId] });
    },
  });
}
