import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listSubscriptions,
  getMetrics,
  cancelSubscription,
} from "@/src/modules/b2c-subscriptions/infrastructure/adapters";

export function useListB2CSubscriptions() {
  return useQuery({
    queryKey: ["b2c-subscriptions"],
    queryFn: () => listSubscriptions(),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useB2CMetrics() {
  return useQuery({
    queryKey: ["b2c-metrics"],
    queryFn: () => getMetrics(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCancelB2CSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subscriptionId: string) =>
      cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2c-subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["b2c-metrics"] });
    },
  });
}
