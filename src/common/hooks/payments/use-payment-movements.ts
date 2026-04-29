import { useQuery } from '@tanstack/react-query';
import { paymentMovementsService } from '@/src/common/services/payments/payment-movements-service';
import type { ListMovementsParams } from '@/src/common/@types/@payment-movements';

export function usePaymentMovements(params?: ListMovementsParams) {
  return useQuery({
    queryKey: ['payment-movements', params],
    queryFn: () => paymentMovementsService.listMovements(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
