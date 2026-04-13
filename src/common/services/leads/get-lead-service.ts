import { apiClient } from "@/src/infraestructure/axios/api";
import type { LeadDetailResponse } from "@/src/shared/domain/types/@lead";

export async function getLeadService(id: string): Promise<LeadDetailResponse> {
  const response = await apiClient.get<LeadDetailResponse>(`/leads/${id}`);
  return response.data;
}
