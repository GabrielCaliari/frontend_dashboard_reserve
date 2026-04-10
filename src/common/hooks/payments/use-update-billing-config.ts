import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateBillingConfigAction } from "@/src/common/actions/payments/update-billing-config";
import type { UpdateBillingConfigDto } from "@/src/shared/domain/types/@payments";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useUpdateBillingConfig() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: UpdateBillingConfigDto) =>
      updateBillingConfigAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-config", tenantId] });
    },
  });
}
