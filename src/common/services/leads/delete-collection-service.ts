import { apiClient } from "@/src/infraestructure/axios/api";
import type { CollectionDetailResponse } from "@/src/shared/domain/types/@lead";

export async function deleteCollectionService(
  id: string,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.delete<CollectionDetailResponse>(
    `/leads/collections/${id}`,
  );
  return response.data;
}
