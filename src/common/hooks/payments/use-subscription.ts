import { useQuery } from "@tanstack/react-query";
import { getSubscriptionAction } from "@/src/common/actions/payments/get-subscription";
import type {
  GetSubscriptionResponse,
  Subscription,
} from "@/src/shared/domain/types/@payments";
import {
  useSelectedTenantId,
  useTenantStore,
} from "@/src/shared/stores/tenant-store";

export function useSubscription() {
  const tenantId = useSelectedTenantId();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);

  return useQuery<GetSubscriptionResponse>({
    queryKey: ["subscription", tenantId],
    queryFn: async () => {
      const result = await getSubscriptionAction(selectedTenant!.id);
      // Normaliza: backend pode retornar o objeto direto ou { subscription: {...} }
      if (result && "id" in result && !("subscription" in result)) {
        return { subscription: result as unknown as Subscription };
      }
      return result;
    },
    enabled: !!tenantId && !!selectedTenant?.id,
    staleTime: 30000,
  });
}
