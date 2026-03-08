import { apiClient } from '@/src/common/config/api';
import type { CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function getCollectionService(id: string): Promise<CollectionDetailResponse> {
  const response = await apiClient.get<CollectionDetailResponse>(`/leads/collections/${id}`);
  return response.data;
}
