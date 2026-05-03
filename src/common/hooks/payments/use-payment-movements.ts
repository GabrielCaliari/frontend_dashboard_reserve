import { useQuery } from '@tanstack/react-query';
import { paymentMovementsService } from '@/src/common/services/payments/payment-movements-service';
import type { ListMovementsParams } from '@/src/common/@types/@payment-movements';
import { useHasSelectedTenant } from '@/src/common/stores/tenant-store';

export function usePaymentMovements(params?: ListMovementsParams) {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ['payment-movements', params],
    queryFn: () => paymentMovementsService.listMovements(params),
    enabled: hasTenant,
    staleTime: 2 * 60 * 1000,
  });
}
