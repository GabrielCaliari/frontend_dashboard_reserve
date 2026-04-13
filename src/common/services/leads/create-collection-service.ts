import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  CollectionDetailResponse,
  CreateCollectionDto,
} from "@/src/shared/domain/types/@lead";

export async function createCollectionService(
  data: CreateCollectionDto,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.post<CollectionDetailResponse>(
    "/leads/collections",
    data,
  );
  return response.data;
}
