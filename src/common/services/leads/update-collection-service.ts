import { apiClient } from '@/src/common/config/api';
import type { CollectionDetailResponse, UpdateCollectionDto } from '@/src/common/@types/@lead';

export async function updateCollectionService(
  id: string,
  data: UpdateCollectionDto
): Promise<CollectionDetailResponse> {
  const response = await apiClient.put<CollectionDetailResponse>(`/leads/collections/${id}`, data);
  return response.data;
}
