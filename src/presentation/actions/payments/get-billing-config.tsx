"use server";

import { getBillingConfigService } from "@/src/modules/payments/infrastructure/adapters";
import type { TenantBillingConfig } from "@/src/shared/domain/types/@payments";

export async function getBillingConfigAction(): Promise<TenantBillingConfig | null> {
  try {
    return await getBillingConfigService();
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    console.error("Error fetching billing config:", error);
    return null;
  }
}
