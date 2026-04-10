"use server";

import { updateCollectionService } from "@/src/common/services/leads/update-collection-service";
import type {
  UpdateCollectionDto,
  CollectionDetailResponse,
} from "@/src/shared/domain/types/@lead";

export async function updateCollectionAction(
  id: string,
  data: UpdateCollectionDto,
): Promise<CollectionDetailResponse> {
  try {
    return await updateCollectionService(id, data);
  } catch (error: any) {
    console.error("Error updating collection:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update collection",
    );
  }
}
