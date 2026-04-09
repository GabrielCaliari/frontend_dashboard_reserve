import { apiClient } from "@/src/common/config/api";
import type {
  Subscription,
  GetSubscriptionResponse,
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
  CancelSubscriptionDto,
  CancelSubscriptionResponse,
} from "@/src/common/@types/@payments";

export async function getSubscriptionByTenantService(
  tenantId: string,
): Promise<GetSubscriptionResponse> {
  const response = await apiClient.get<GetSubscriptionResponse>(
    `/subscriptions/tenant/${tenantId}`,
  );
  return response.data;
}

export async function createCheckoutSessionService(
  data: CreateCheckoutSessionDto,
): Promise<CheckoutSessionResponse> {
  const response = await apiClient.post<CheckoutSessionResponse>(
    "/subscriptions/checkout",
    data,
  );
  return response.data;
}

export async function cancelSubscriptionService(
  subscriptionId: string,
  data: CancelSubscriptionDto,
): Promise<CancelSubscriptionResponse> {
  const response = await apiClient.post<CancelSubscriptionResponse>(
    `/subscriptions/${subscriptionId}/cancel`,
    data,
  );
  return response.data;
}
