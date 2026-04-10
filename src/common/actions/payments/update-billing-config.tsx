"use server";

import { updateBillingConfigService } from "@/src/common/services/payments/billing-config-service";
import type {
  UpdateBillingConfigDto,
  TenantBillingConfig,
} from "@/src/shared/domain/types/@payments";

export async function updateBillingConfigAction(
  data: UpdateBillingConfigDto,
): Promise<TenantBillingConfig> {
  try {
    return await updateBillingConfigService(data);
  } catch (error: any) {
    console.error("Error updating billing config:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update billing config",
    );
  }
}
