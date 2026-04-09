"use server";

import { getCollectionLeadsService } from "@/src/common/services/leads/get-collection-leads-service";
import type { LeadListResponse } from "@/src/common/@types/@lead";

interface GetCollectionLeadsParams {
  page?: number;
  limit?: number;
}

export async function getCollectionLeadsAction(
  collectionId: string,
  params: GetCollectionLeadsParams = {},
): Promise<LeadListResponse> {
  try {
    return await getCollectionLeadsService(collectionId, params);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to get collection leads",
    );
  }
}
