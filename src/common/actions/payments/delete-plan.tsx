"use server";

import { deletePlanService } from "@/src/common/services/payments/plans-service";
import { getTenantIdFromCookie } from "@/src/shared/utils/get-tenant-id-server";

export async function deletePlanAction(id: string): Promise<void> {
  try {
    const tenantId = await getTenantIdFromCookie();

    if (!tenantId) {
      throw new Error(
        "Nenhum tenant selecionado. Selecione um tenant antes de deletar um plano.",
      );
    }

    await deletePlanService(id, tenantId);
  } catch (error: any) {
    console.error("Error deleting plan:", error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete plan";
    throw new Error(message);
  }
}
