import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Tenant } from "@/src/shared/domain/types/@auth";

interface TenantState {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
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

/**
 * v1/v2 persistiam `dashboardScope` ('tenant' | 'global'). O conceito nao existe
 * mais: o acesso de super admin vem das capabilities do tenant, nao de um escopo
 * guardado no cookie. Descartamos o campo para que sessoes abertas nao carreguem
 * um campo morto -- e, principalmente, para que `useSelectedTenantId` pare de
 * devolver null (o que suprimia o header `x-tenant-id`).
 */
export function migrateTenantStore(persistedState: unknown): TenantState {
  const isRecord =
    typeof persistedState === "object" &&
    persistedState !== null &&
    !Array.isArray(persistedState);
  const state = (isRecord ? persistedState : {}) as Partial<TenantState> & {
    dashboardScope?: string;
  };
  const { dashboardScope: _dashboardScope, ...rest } = state;

  return { selectedTenant: null, ...rest } as TenantState;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedTenant: null,
      setSelectedTenant: (tenant) => set({ selectedTenant: tenant }),
      clearSelectedTenant: () => set({ selectedTenant: null }),
    }),
    {
      name: "tenant-storage",
      storage: createJSONStorage(() => cookieStorage),
      version: 3,
      migrate: (persistedState) => migrateTenantStore(persistedState),
    },
  ),
);

// Hook para obter o tenant ID selecionado (util para APIs)
export const useSelectedTenantId = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant?.id ?? null;
};

// Hook para verificar se um tenant esta selecionado
export const useHasSelectedTenant = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant !== null;
};
