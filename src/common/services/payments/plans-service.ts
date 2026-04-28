import { apiClient } from '@/src/common/config/api';
import type {
  StripePlan,
  CreateStripePlanDto,
  UpdateStripePlanDto,
  ArchivePlanResponse,
} from '@/src/common/@types/@payments';

export async function listPlansAdminService(): Promise<StripePlan[]> {
  // O tenant_id deve vir do header x-tenant-id (injetado automaticamente pelo interceptor)
  // O backend deve usar o tenant selecionado, não o tenant do admin
  const response = await apiClient.get<StripePlan[]>('/plans/admin/list');
  return response.data;
}

export async function createPlanService(data: CreateStripePlanDto): Promise<StripePlan> {
  const response = await apiClient.post<StripePlan>('/plans/admin/create', data);
  return response.data;
}

export async function updatePlanService(
  id: string,
  data: UpdateStripePlanDto,
  tenantId: string
): Promise<StripePlan> {
  const response = await apiClient.patch<StripePlan>(`/plans/admin/${id}`, data, {
    params: { tenant_id: tenantId }
  });
  return response.data;
}

export async function archivePlanService(id: string, tenantId: string): Promise<ArchivePlanResponse> {
  const response = await apiClient.delete<ArchivePlanResponse>(`/plans/admin/${id}`, {
    params: { tenant_id: tenantId }
  });
  return response.data;
}

export async function deletePlanService(id: string, tenantId: string): Promise<void> {
  // Note: The API may not have a separate hard-delete endpoint
  // This uses the same DELETE endpoint as archive, but for already archived plans
  await apiClient.delete(`/plans/admin/${id}`, {
    params: { tenant_id: tenantId }
  });
}
