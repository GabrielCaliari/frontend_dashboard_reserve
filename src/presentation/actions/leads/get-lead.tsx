"use server";

import { getLeadService } from "@/src/modules/leads/infrastructure/adapters";
import type { LeadDetailResponse } from "@/src/shared/domain/types/@lead";

export async function getLeadAction(id: string): Promise<LeadDetailResponse> {
  try {
    return await getLeadService(id);
  } catch (error: any) {
    console.error("Error getting lead:", error);
    throw new Error(error?.response?.data?.message || "Failed to get lead");
  }
}
