import { apiClient } from '@/src/common/config/api';
import type { UpdateCollectionDto, CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function updateCollectionService(
  id: number,
  data: UpdateCollectionDto
): Promise<CollectionDetailResponse> {
  const response = await apiClient.put<CollectionDetailResponse>(
    `/leads/leads/collections/${id}`,
    data
  );
  return response.data;
}
