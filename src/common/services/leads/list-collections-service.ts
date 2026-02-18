import { apiClient } from '@/src/common/config/api';
import type { CollectionListResponse, CollectionAccessMode } from '@/src/common/@types/@lead';

interface ListCollectionsParams {
  page?: number;
  limit?: number;
  access_mode?: CollectionAccessMode;
  active?: boolean;
}

export async function listCollectionsService(
  params: ListCollectionsParams = {}
): Promise<CollectionListResponse> {
  const { page = 1, limit = 10, access_mode, active } = params;

  const response = await apiClient.get<CollectionListResponse>(
    '/leads/leads/collections',
    {
      params: { page, limit, access_mode, active },
    }
  );

  return response.data;
}
