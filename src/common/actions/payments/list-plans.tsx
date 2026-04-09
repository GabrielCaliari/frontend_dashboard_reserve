"use server";

import { listPlansAdminService } from "@/src/common/services/payments/plans-service";
import type { StripePlan } from "@/src/common/@types/@payments";

export async function listPlansAction(): Promise<StripePlan[]> {
  try {
    // O tenant_id é enviado automaticamente via header x-tenant-id pelo interceptor
    // O backend DEVE usar o tenant selecionado (x-tenant-id), não o tenant do admin
    return await listPlansAdminService();
  } catch (error: any) {
    console.error("Error listing plans:", error);
    console.error("Error response:", error?.response?.data);

    return [];
  }
}
