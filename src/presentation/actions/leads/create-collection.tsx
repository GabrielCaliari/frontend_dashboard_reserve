"use server";

import { createCollectionService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  CreateCollectionDto,
  CollectionDetailResponse,
} from "@/src/shared/domain/types/@lead";

export async function createCollectionAction(
  data: CreateCollectionDto,
): Promise<CollectionDetailResponse> {
  try {
    return await createCollectionService(data);
  } catch (error: any) {
    console.error("Error creating collection:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to create collection",
    );
  }
}
