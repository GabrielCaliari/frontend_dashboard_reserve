import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  TenantCapabilitiesProvider,
  useTenantCapabilities,
} from "./tenant-capabilities-provider";

const fetchTenantCapabilities = vi.fn();

vi.mock("../../infrastructure/tenant-capabilities-adapter", () => ({
  fetchTenantCapabilities: (...args: unknown[]) =>
    fetchTenantCapabilities(...args),
}));

let selectedTenantId: string | null = "tenant-1";

vi.mock("@/src/shared/stores/tenant-store", () => ({
  useSelectedTenantId: () => selectedTenantId,
}));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={client}>
      <TenantCapabilitiesProvider>{children}</TenantCapabilitiesProvider>
    </QueryClientProvider>
  );
}

describe("useTenantCapabilities", () => {
  it("fetches and normalizes capabilities for the selected tenant", async () => {
    selectedTenantId = "tenant-1";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-1",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "super_admin",
      modules: { leads: { enabled: true, source: "master" } },
      permissions: ["*"],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isMasterTenant).toBe(true);
    expect(result.current.tenantType).toBe("MASTER");
    expect(result.current.hasPermission("anything.at.all")).toBe(true);
  });

  it("does not fetch when no tenant is selected", async () => {
    selectedTenantId = null;
    fetchTenantCapabilities.mockClear();

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchTenantCapabilities).not.toHaveBeenCalled();
    expect(result.current.isMasterTenant).toBe(false);
  });

  it("hasPermission checks the resolved permission set for non-wildcard roles", async () => {
    selectedTenantId = "tenant-2";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-2",
      tenantType: "COMMON",
      isMasterTenant: false,
      role: "manager",
      modules: {},
      permissions: ["leads.read"],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasPermission("leads.read")).toBe(true);
    expect(result.current.hasPermission("cms.article.read")).toBe(false);
  });

  it("exposes a ready policy without inferring authorization from master-tenant scope", async () => {
    selectedTenantId = "tenant-master";
    fetchTenantCapabilities.mockResolvedValueOnce({
      tenantId: "tenant-master",
      tenantType: "MASTER",
      isMasterTenant: true,
      role: "viewer",
      modules: {},
      permissions: [],
    });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.policy.ready).toBe(true);
    expect(result.current.policy.can("tenants.update" as never)).toBe(false);
  });

  it("refreshes and normalizes capabilities on demand", async () => {
    selectedTenantId = "tenant-3";
    fetchTenantCapabilities
      .mockResolvedValueOnce({
        tenantId: "tenant-3",
        tenantType: "COMMON",
        isMasterTenant: false,
        role: "viewer",
        modules: {},
        permissions: [],
      })
      .mockResolvedValueOnce({
        tenantId: "tenant-3",
        tenantType: "COMMON",
        isMasterTenant: false,
        role: "owner",
        modules: {},
        permissions: ["admins.update"],
      });

    const { result } = renderHook(() => useTenantCapabilities(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const capabilities = await result.current.refreshCapabilities();

    expect(capabilities?.role).toBe("owner");
    expect(capabilities?.permissions.has("admins.update")).toBe(true);
  });
});
