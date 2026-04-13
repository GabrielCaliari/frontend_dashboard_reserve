import { apiClient } from "@/src/infraestructure/axios/api";

export async function deleteLeadService(
  id: string,
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/leads/${id}`);
  return response.data;
}
