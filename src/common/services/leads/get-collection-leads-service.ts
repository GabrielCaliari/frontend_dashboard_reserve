import { apiClient } from '@/src/common/config/api';
import type { LeadListResponse } from '@/src/common/@types/@lead';

interface GetCollectionLeadsParams {
  page: number;
  limit: number;
}

export async function getCollectionLeadsService(
  collectionId: number,
  params: GetCollectionLeadsParams
): Promise<LeadListResponse> {
  const response = await apiClient.get<LeadListResponse>(
    `/leads/leads/collections/${collectionId}/leads`,
    { params }
  );
  return response.data;
}
