"use server";

import { archivePlanService } from "@/src/modules/payments/infrastructure/adapters";
import { getTenantIdFromCookie } from "@/src/shared/utils/get-tenant-id-server";
import type { ArchivePlanResponse } from "@/src/shared/domain/types/@payments";

export async function archivePlanAction(
  id: string,
): Promise<ArchivePlanResponse> {
  try {
    const tenantId = await getTenantIdFromCookie();

    if (!tenantId) {
      throw new Error(
        "Nenhum tenant selecionado. Selecione um tenant antes de arquivar um plano.",
      );
    }

    return await archivePlanService(id, tenantId);
  } catch (error: any) {
    console.error("Error archiving plan:", error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to archive plan";
    throw new Error(message);
  }
}
