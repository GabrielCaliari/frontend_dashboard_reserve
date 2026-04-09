import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/src/common/config/api";
import type {
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
} from "@/src/common/@types/@payments";

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: CreateCheckoutSessionDto) =>
      apiClient
        .post<CheckoutSessionResponse>("/subscriptions/checkout", data)
        .then((r) => r.data),
  });
}
