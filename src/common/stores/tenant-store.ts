import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Tenant } from '@/src/common/@types/@auth';

interface TenantState {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  clearSelectedTenant: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      selectedTenant: null,
      setSelectedTenant: (tenant) => {
        set({ selectedTenant: tenant });
        // Sincroniza com cookie para que Server Actions tenham acesso ao tenant
        if (typeof document !== 'undefined') {
          if (tenant?.id) {
            document.cookie = `x-tenant-id=${tenant.id}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            document.cookie = 'x-tenant-id=; path=/; max-age=0';
          }
        }
      },
      clearSelectedTenant: () => {
        set({ selectedTenant: null });
        if (typeof document !== 'undefined') {
          document.cookie = 'x-tenant-id=; path=/; max-age=0';
        }
      },
    }),
    {
      name: 'tenant-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hook para obter o tenant ID selecionado (útil para APIs)
export const useSelectedTenantId = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant?.id || null;
};

// Hook para verificar se um tenant está selecionado
export const useHasSelectedTenant = () => {
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  return selectedTenant !== null;
};
