import { apiClient } from "@/src/common/config/api";
import type {
  LeadDetailResponse,
  UpdateLeadDto,
} from "@/src/shared/domain/types/@lead";

export async function updateLeadService(
  id: string,
  data: UpdateLeadDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.patch<LeadDetailResponse>(
    `/leads/${id}`,
    data,
  );
  return response.data;
}
