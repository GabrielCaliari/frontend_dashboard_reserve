import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  LeadDetailResponse,
  UpdateLeadStatusDto,
} from "@/src/shared/domain/types/@lead";

export async function updateLeadStatusService(
  id: string,
  data: UpdateLeadStatusDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.put<LeadDetailResponse>(
    `/leads/${id}/status`,
    data,
  );
  return response.data;
}
