import { apiClient } from '@/src/common/config/api';
import type { RegenerateKeyResponse } from '@/src/common/@types/@lead';

export async function regenerateCollectionKeyService(
  id: number
): Promise<RegenerateKeyResponse> {
  const response = await apiClient.post<RegenerateKeyResponse>(
    `/leads/leads/collections/${id}/regenerate-key`
  );
  return response.data;
}
