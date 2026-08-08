import { apiClient } from "@/src/infraestructure/axios/api";

import {
  normalizeModuleFlags,
  toBackendModulePatch,
  type GateableModule,
  type ModuleFlags,
} from "../domain/tenant-modules";

/**
 * SuperadminModulesController: GET/PATCH /api/tenants/:tenantId/modules,
 * protegido por `settings.modules.manage`. Deliberadamente sem TenantGuard --
 * o superadmin enderecca qualquer tenant pelo parametro de rota.
 */
export async function fetchTenantModules(
  tenantId: string,
): Promise<ModuleFlags> {
  const response = await apiClient.get(`/api/tenants/${tenantId}/modules`);
  return normalizeModuleFlags(response.data);
}

export async function updateTenantModules(
  tenantId: string,
  patch: Partial<Record<GateableModule, boolean>>,
): Promise<ModuleFlags> {
  const response = await apiClient.patch(`/api/tenants/${tenantId}/modules`, {
    modules: toBackendModulePatch(patch),
  });
  return normalizeModuleFlags(response.data);
}
