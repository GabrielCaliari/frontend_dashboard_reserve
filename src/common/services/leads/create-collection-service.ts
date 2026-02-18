import { apiClient } from '@/src/common/config/api';
import type { CreateCollectionDto, CollectionDetailResponse } from '@/src/common/@types/@lead';

export async function createCollectionService(
  data: CreateCollectionDto
): Promise<CollectionDetailResponse> {
  const response = await apiClient.post<CollectionDetailResponse>(
    '/leads/leads/collections',
    data
  );
  return response.data;
}
