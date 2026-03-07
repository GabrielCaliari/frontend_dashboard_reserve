import { apiClient } from '@/src/common/config/api';
import type { CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function deleteCollectionService(id: number): Promise<CollectionDetailResponse> {
  const response = await apiClient.delete<CollectionDetailResponse>(`/leads/collections/${id}`);
  return response.data;
}
