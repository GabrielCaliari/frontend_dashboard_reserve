import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Tenant } from "@/src/shared/domain/types/@auth";

export type DashboardScope = "tenant" | "global";

interface TenantState {
  selectedTenant: Tenant | null;
  dashboardScope: DashboardScope;
  setSelectedTenant: (tenant: Tenant | null) => void;
  setDashboardScope: (scope: DashboardScope) => void;
  clearSelectedTenant: () => void;
}

const COOKIE_MAX_AGE = 86400; // 24h

/**
 * Storage adapter que persiste o state do Zustand diretamente em cookie.
 * Unica fonte de verdade -- client e server leem o mesmo cookie.
 */
const cookieStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem(name) {
    if (typeof document === "undefined") return null;
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`));
    if (!match) return null;
    try {
      return decodeURIComponent(match.split("=").slice(1).join("="));
    } catch {
      return null;
    }
  },
  setItem(name, value) {
    if (typeof document === "undefined") return;
    const isSecure = window.location.protocol === "https:";
    const flags = `path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${isSecure ? "; Secure" : ""}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${flags}`;
  },
  removeItem(name) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; max-age=0`;
  },
};

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedTenant: null,
      dashboardScope: "tenant",
      setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
      setDashboardScope: (dashboardScope) => set({ dashboardScope }),
      clearSelectedTenant: () =>
        set({ selectedTenant: null, dashboardScope: "tenant" }),
    }),
    {
      name: "tenant-storage",
      storage: createJSONStorage(() => cookieStorage),
    },
  ),
);

// Hook para obter o tenant ID selecionado (útil para APIs)
export const useSelectedTenantId = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const dashboardScope = useTenantStore((state) => state.dashboardScope);
  if (dashboardScope === "global") return null;
  return selectedTenant?.id || null;
};

// Hook para verificar se um tenant está selecionado
export const useHasSelectedTenant = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const dashboardScope = useTenantStore((state) => state.dashboardScope);
  return dashboardScope === "tenant" && selectedTenant !== null;
};

export const useDashboardScope = () => {
  return useTenantStore((state) => state.dashboardScope);
};

export const useIsGlobalDashboardScope = () => {
  return useTenantStore((state) => state.dashboardScope === "global");
};
