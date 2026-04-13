import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  CollectionDetailResponse,
  UpdateCollectionDto,
} from "@/src/shared/domain/types/@lead";

export async function updateCollectionService(
  id: string,
  data: UpdateCollectionDto,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.put<CollectionDetailResponse>(
    `/leads/collections/${id}`,
    data,
  );
  return response.data;
}
