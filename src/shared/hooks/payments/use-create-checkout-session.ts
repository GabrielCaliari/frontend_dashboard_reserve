import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
} from "@/src/shared/domain/types/@payments";

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: CreateCheckoutSessionDto) =>
      apiClient
        .post<CheckoutSessionResponse>("/subscriptions/checkout", data)
        .then((r) => r.data),
  });
}
