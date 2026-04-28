import { useQuery } from '@tanstack/react-query';
import { b2bPaymentsService } from '@/src/common/services/b2b-payments-service';
import type { PurchaseStatus } from '@/src/common/@types/@b2b-payments';

export function useListB2BProducts() {
  return useQuery({
    queryKey: ['b2b-products'],
    queryFn: () => b2bPaymentsService.listProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useListB2BPurchases(params?: {
  status?: PurchaseStatus | 'all';
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['b2b-purchases', params],
    queryFn: () => b2bPaymentsService.listPurchases(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useGetB2BPurchase(id: string) {
  return useQuery({
    queryKey: ['b2b-purchase', id],
    queryFn: () => b2bPaymentsService.getPurchase(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useB2BMetrics() {
  return useQuery({
    queryKey: ['b2b-metrics'],
    queryFn: () => b2bPaymentsService.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
