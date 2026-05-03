import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { b2cSubscriptionsService } from '@/src/common/services/b2c-subscriptions-service';

export function useListB2CSubscriptions() {
  return useQuery({
    queryKey: ['b2c-subscriptions'],
    queryFn: () => b2cSubscriptionsService.listSubscriptions(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useB2CMetrics() {
  return useQuery({
    queryKey: ['b2c-metrics'],
    queryFn: () => b2cSubscriptionsService.getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCancelB2CSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      b2cSubscriptionsService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['b2c-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['b2c-metrics'] });
    },
  });
}
