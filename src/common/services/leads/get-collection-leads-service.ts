import { apiClient } from "@/src/common/config/api";
import type { LeadListResponse } from "@/src/shared/domain/types/@lead";

interface GetCollectionLeadsParams {
  page?: number;
  limit?: number;
}

export async function getCollectionLeadsService(
  collectionId: string,
  params: GetCollectionLeadsParams = {},
): Promise<LeadListResponse> {
  const { page = 1, limit = 30 } = params;
  const response = await apiClient.get<LeadListResponse>(
    `/leads/collections/${collectionId}/leads`,
    { params: { page, limit } },
  );
  return response.data;
}
