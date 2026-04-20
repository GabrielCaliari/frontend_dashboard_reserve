"use server";

import { getCollectionService } from "@/src/modules/leads/infrastructure/adapters";
import type { CollectionDetailResponse } from "@/src/shared/domain/types/@lead";

export async function getCollectionAction(
  id: string,
): Promise<CollectionDetailResponse> {
  try {
    return await getCollectionService(id);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to get collection",
    );
  }
}
