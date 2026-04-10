import { apiClient } from "@/src/common/config/api";
import type { RegenerateKeyResponse } from "@/src/shared/domain/types/@lead";

export async function regenerateCollectionKeyService(
  id: string,
): Promise<RegenerateKeyResponse> {
  const response = await apiClient.post<RegenerateKeyResponse>(
    `/leads/collections/${id}/regenerate-key`,
  );
  return response.data;
}
