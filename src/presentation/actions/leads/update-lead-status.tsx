"use server";

import { updateLeadStatusService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  LeadDetailResponse,
  UpdateLeadStatusDto,
} from "@/src/shared/domain/types/@lead";

export async function updateLeadStatusAction(
  id: string,
  data: UpdateLeadStatusDto,
): Promise<LeadDetailResponse> {
  try {
    return await updateLeadStatusService(id, data);
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update lead status",
    );
  }
}
