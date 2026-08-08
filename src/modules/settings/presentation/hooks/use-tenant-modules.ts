import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  fetchTenantModules,
  updateTenantModules,
} from "../../infrastructure/tenant-modules-adapter";
import type { GateableModule } from "../../domain/tenant-modules";

export function useTenantModules(tenantId: string | null | undefined) {
  return useQuery({
    queryKey: ["tenant-modules", tenantId],
    queryFn: () => fetchTenantModules(tenantId!),
    enabled: Boolean(tenantId),
  });
}

export function useUpdateTenantModules(tenantId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<Record<GateableModule, boolean>>) =>
      updateTenantModules(tenantId, patch),
    onSuccess: (flags) => {
      queryClient.setQueryData(["tenant-modules", tenantId], flags);
      // A sidebar do proprio admin deriva de tenant-capabilities; sem invalidar,
      // o menu so refletiria a mudanca depois do staleTime de 60s.
      queryClient.invalidateQueries({ queryKey: ["tenant-capabilities"] });
    },
  });
}
