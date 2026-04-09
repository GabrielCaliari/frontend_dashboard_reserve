import { apiClient } from "@/src/common/config/api";
import type { LeadDetailResponse } from "@/src/common/@types/@lead";

export async function getLeadService(id: string): Promise<LeadDetailResponse> {
  const response = await apiClient.get<LeadDetailResponse>(`/leads/${id}`);
  return response.data;
}
