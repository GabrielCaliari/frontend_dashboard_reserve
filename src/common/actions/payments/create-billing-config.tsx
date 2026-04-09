"use server";

import { createBillingConfigService } from "@/src/common/services/payments/billing-config-service";
import type {
  CreateBillingConfigDto,
  TenantBillingConfig,
} from "@/src/common/@types/@payments";

export async function createBillingConfigAction(
  data: CreateBillingConfigDto,
): Promise<TenantBillingConfig> {
  try {
    return await createBillingConfigService(data);
  } catch (error: any) {
    console.error("Error creating billing config:", error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create billing config";
    throw new Error(message);
  }
}
