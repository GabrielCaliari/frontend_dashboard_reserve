"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  normalizeTenantCapabilities,
  type TenantCapabilities,
} from "../../domain/tenant-capabilities";
import { fetchTenantCapabilities } from "../../infrastructure/tenant-capabilities-adapter";

import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import {
  createAccessPolicy,
  type AccessPolicy,
} from "@/src/shared/domain/access-management/access-policy";

const EMPTY_CAPABILITIES = normalizeTenantCapabilities({});

interface TenantCapabilitiesContextValue extends TenantCapabilities {
  hasPermission: (permission: string) => boolean;
  policy: AccessPolicy;
  refreshCapabilities: () => Promise<TenantCapabilities | undefined>;
  isLoading: boolean;
  isError: boolean;
}

const TenantCapabilitiesContext =
  createContext<TenantCapabilitiesContextValue>({
    ...EMPTY_CAPABILITIES,
    hasPermission: () => false,
    policy: createAccessPolicy({ ready: false }),
    refreshCapabilities: async () => undefined,
    isLoading: false,
    isError: false,
  });

export function TenantCapabilitiesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const tenantId = useSelectedTenantId();
  const query = useQuery({
    queryKey: ["tenant-capabilities", tenantId],
    queryFn: fetchTenantCapabilities,
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });

  const value = useMemo<TenantCapabilitiesContextValue>(() => {
    const capabilities = query.data
      ? normalizeTenantCapabilities(query.data)
      : EMPTY_CAPABILITIES;
    const isLoading = query.isFetching;
    const isError = query.isError;

    return {
      ...capabilities,
      hasPermission: (permission: string) =>
        capabilities.permissions.has("*") ||
        capabilities.permissions.has(permission),
      policy: createAccessPolicy({
        permissions: capabilities.permissions,
        role: capabilities.role,
        ready: Boolean(tenantId) && !isLoading && !isError,
      }),
      refreshCapabilities: async () => {
        const result = await query.refetch();

        return result.data
          ? normalizeTenantCapabilities(result.data)
          : undefined;
      },
      isLoading,
      isError,
    };
  }, [query.data, query.isError, query.isFetching, query.refetch, tenantId]);

  return (
    <TenantCapabilitiesContext.Provider value={value}>
      {children}
    </TenantCapabilitiesContext.Provider>
  );
}

export const useTenantCapabilities = () => useContext(TenantCapabilitiesContext);
