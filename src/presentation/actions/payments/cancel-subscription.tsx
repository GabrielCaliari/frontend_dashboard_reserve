"use server";

import { cancelSubscriptionService } from "@/src/modules/payments/infrastructure/adapters";
import type {
  CancelSubscriptionDto,
  CancelSubscriptionResponse,
} from "@/src/shared/domain/types/@payments";

export async function cancelSubscriptionAction(
  subscriptionId: string,
  data: CancelSubscriptionDto,
): Promise<CancelSubscriptionResponse> {
  try {
    return await cancelSubscriptionService(subscriptionId, data);
  } catch (error: any) {
    console.error("Error canceling subscription:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to cancel subscription",
    );
  }
}
