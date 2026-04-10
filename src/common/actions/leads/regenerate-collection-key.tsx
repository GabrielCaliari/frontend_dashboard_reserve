"use server";

import { regenerateCollectionKeyService } from "@/src/common/services/leads/regenerate-collection-key-service";
import type { RegenerateKeyResponse } from "@/src/shared/domain/types/@lead";

export async function regenerateCollectionKeyAction(
  id: string,
): Promise<RegenerateKeyResponse> {
  try {
    return await regenerateCollectionKeyService(id);
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to regenerate collection key",
    );
  }
}
