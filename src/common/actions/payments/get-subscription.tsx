"use server";

import { getSubscriptionByTenantService } from "@/src/common/services/payments/subscriptions-service";
import type { GetSubscriptionResponse } from "@/src/common/@types/@payments";

export async function getSubscriptionAction(
  tenantId: string,
): Promise<GetSubscriptionResponse> {
  try {
    const result = await getSubscriptionByTenantService(tenantId);
    return result;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return { subscription: null };
    }
    console.error("Error fetching subscription:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch subscription",
    );
  }
}
