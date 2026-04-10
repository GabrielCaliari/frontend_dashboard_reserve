import { apiClient } from "@/src/common/config/api";
import type {
  BlockedPeriod,
  BlockedPeriodListResponse,
} from "@/src/shared/domain/types/@appointment";

export interface ListBlockedPeriodsParams {
  page?: number;
  limit?: number;
}

export interface ListBlockedPeriodsResponse {
  data: BlockedPeriodListResponse;
  status: number;
}

export interface CreateBlockedPeriodResponse {
  data: BlockedPeriod;
  status: number;
}

export async function listBlockedPeriodsService(
  params: ListBlockedPeriodsParams = {},
): Promise<ListBlockedPeriodsResponse> {
  const response = await apiClient.get(
    "/leads/admin/appointments/blocked-periods",
    { params },
  );
  return response.data;
}

export async function createBlockedPeriodService(
  period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">,
): Promise<CreateBlockedPeriodResponse> {
  const response = await apiClient.post(
    "/leads/admin/appointments/blocked-periods",
    period,
  );
  return response.data;
}

export async function updateBlockedPeriodService(
  id: string,
  period: Omit<BlockedPeriod, "id" | "tenantId" | "createdAt">,
): Promise<CreateBlockedPeriodResponse> {
  const response = await apiClient.patch(
    `/leads/admin/appointments/blocked-periods/${id}`,
    period,
  );
  return response.data;
}

export async function deleteBlockedPeriodService(id: string): Promise<void> {
  await apiClient.delete(`/leads/admin/appointments/blocked-periods/${id}`);
}
