"use server";

import { createLeadService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  CreateLeadDto,
  LeadDetailResponse,
} from "@/src/shared/domain/types/@lead";

export async function createLeadAction(
  data: CreateLeadDto,
): Promise<LeadDetailResponse> {
  try {
    return await createLeadService(data);
  } catch (error: any) {
    console.error("Error creating lead:", error);
    throw new Error(error?.response?.data?.message || "Failed to create lead");
  }
}
