import { useQuery } from '@tanstack/react-query';
import { getSubscriptionAction } from '@/src/common/actions/payments/get-subscription';
import type { GetSubscriptionResponse } from '@/src/common/@types/@payments';
import { useSelectedTenantId, useTenantStore } from '@/src/common/stores/tenant-store';

export function useSubscription() {
  const tenantId = useSelectedTenantId();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);

  return useQuery<GetSubscriptionResponse>({
    queryKey: ['subscription', tenantId],
    queryFn: () => getSubscriptionAction(selectedTenant!.id),
    enabled: !!tenantId && !!selectedTenant?.id,
    staleTime: 30000,
  });
}
