"use server";

import { updatePlanService } from "@/src/common/services/payments/plans-service";
import { getTenantIdFromCookie } from "@/src/shared/utils/get-tenant-id-server";
import type {
  UpdateStripePlanDto,
  StripePlan,
} from "@/src/shared/domain/types/@payments";

export async function updatePlanAction(
  id: string,
  data: UpdateStripePlanDto,
): Promise<StripePlan> {
  try {
    const tenantId = await getTenantIdFromCookie();

    if (!tenantId) {
      throw new Error(
        "Nenhum tenant selecionado. Selecione um tenant antes de atualizar um plano.",
      );
    }

    return await updatePlanService(id, data, tenantId);
  } catch (error: any) {
    console.error("Error updating plan:", error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update plan";
    throw new Error(message);
  }
}
