import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelSubscriptionAction } from "@/src/common/actions/payments/cancel-subscription";
import type { CancelSubscriptionDto } from "@/src/common/@types/@payments";
import { useSelectedTenantId } from "@/src/common/stores/tenant-store";

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({
      subscriptionId,
      data,
    }: {
      subscriptionId: string;
      data: CancelSubscriptionDto;
    }) => cancelSubscriptionAction(subscriptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription", tenantId] });
    },
  });
}
