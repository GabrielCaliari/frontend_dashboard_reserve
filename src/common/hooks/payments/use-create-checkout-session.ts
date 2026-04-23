import { useMutation } from '@tanstack/react-query';
import { createCheckoutSessionAction } from '@/src/common/actions/payments/create-checkout-session';
import type { CreateCheckoutSessionDto } from '@/src/common/@types/@payments';

export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (data: CreateCheckoutSessionDto) => createCheckoutSessionAction(data),
  });
}
