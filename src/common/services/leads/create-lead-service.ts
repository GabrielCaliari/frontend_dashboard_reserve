import { apiClient } from "@/src/common/config/api";
import type {
  CreateLeadDto,
  LeadDetailResponse,
} from "@/src/common/@types/@lead";

export async function createLeadService(
  data: CreateLeadDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.post<LeadDetailResponse>("/leads", data);
  return response.data;
}
