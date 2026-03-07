import { apiClient } from '@/src/common/config/api';
import type { CollectionListResponse } from '@/src/common/@types/@lead';

interface ListCollectionsParams {
  page?: number;
  limit?: number;
  active?: boolean;
}

export async function listCollectionsService(
  params: ListCollectionsParams = {}
): Promise<CollectionListResponse> {
  const { page = 1, limit = 10, active } = params;
  const response = await apiClient.get<CollectionListResponse>('/leads/collections', {
    params: { page, limit, ...(active !== undefined && { active }) },
  });
  return response.data;
}
