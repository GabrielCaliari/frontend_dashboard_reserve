import { apiClient } from "@/src/infraestructure/axios/api";
import type {
  TenantBillingConfig,
  CreateBillingConfigDto,
  UpdateBillingConfigDto,
} from "@/src/shared/domain/types/@payments";

export async function getBillingConfigService(): Promise<TenantBillingConfig> {
  const response = await apiClient.get<TenantBillingConfig>(
    "/payments/billing-config",
  );
  return response.data;
}

export async function createBillingConfigService(
  data: CreateBillingConfigDto,
): Promise<TenantBillingConfig> {
  const response = await apiClient.post<TenantBillingConfig>(
    "/payments/billing-config",
    data,
  );
  return response.data;
}

export async function updateBillingConfigService(
  data: UpdateBillingConfigDto,
): Promise<TenantBillingConfig> {
  const response = await apiClient.patch<TenantBillingConfig>(
    "/payments/billing-config",
    data,
  );
  return response.data;
}

export async function deleteBillingConfigService(): Promise<void> {
  await apiClient.delete("/payments/billing-config");
}
