"use server";

import { listCollectionsService } from "@/src/common/services/leads/list-collections-service";
import type { CollectionListResponse } from "@/src/shared/domain/types/@lead";

interface ListCollectionsParams {
  page?: number;
  limit?: number;
  active?: boolean;
}

export async function listCollectionsAction(
  params: ListCollectionsParams = {},
): Promise<CollectionListResponse> {
  try {
    return await listCollectionsService(params);
  } catch (error: any) {
    console.error("Error listing collections:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to list collections",
    );
  }
}
