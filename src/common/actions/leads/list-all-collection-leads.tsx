"use server";

import { listAllCollectionLeadsService } from "@/src/common/services/leads/list-all-collection-leads-service";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";

interface ListAllCollectionLeadsParams {
  page?: number;
  limit?: number;
}

export async function listAllCollectionLeadsAction(
  params: ListAllCollectionLeadsParams = {},
): Promise<LeadListResponse> {
  try {
    return await listAllCollectionLeadsService(params);
  } catch (error: any) {
    console.error("Error listing all collection leads:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to list collection leads",
    );
  }
}
