"use server";

import { updateLeadService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  LeadDetailResponse,
  UpdateLeadDto,
} from "@/src/shared/domain/types/@lead";

export async function updateLeadAction(
  id: string,
  data: UpdateLeadDto,
): Promise<LeadDetailResponse> {
  try {
    return await updateLeadService(id, data);
  } catch (error: any) {
    console.error("Error updating lead:", error);
    throw new Error(error?.response?.data?.message || "Failed to update lead");
  }
}
