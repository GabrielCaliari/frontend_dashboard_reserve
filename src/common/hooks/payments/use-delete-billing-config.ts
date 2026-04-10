import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteBillingConfigAction } from "@/src/common/actions/payments/delete-billing-config";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useDeleteBillingConfig() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: () => deleteBillingConfigAction(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-config", tenantId] });
    },
  });
}
