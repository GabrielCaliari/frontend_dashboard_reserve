import { apiClient } from "@/src/infraestructure/axios/api";

export async function fetchTenantCapabilities(): Promise<unknown> {
  const response = await apiClient.get("/api/tenant-capabilities");
  return response.data;
}
