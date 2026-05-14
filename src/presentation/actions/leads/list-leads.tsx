"use server";

import { listLeadsService } from "@/src/modules/leads/infrastructure/adapters";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";

interface ListLeadsParams {
  page?: number;
  limit?: number;
  status?: number;
  origin?: number;
  tenantId?: number;
}

export async function listLeadsAction(
  params: ListLeadsParams = {},
): Promise<LeadListResponse> {
  try {
    return await listLeadsService(params);
  } catch (error: any) {
    console.error("Error listing leads:", error);
    throw new Error(error?.response?.data?.message || "Failed to list leads");
  }
}
