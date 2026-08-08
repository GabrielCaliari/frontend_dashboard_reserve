"use client";

import { useHotelMilestones } from "@/src/shared/hooks/hotel-portal";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { MilestoneList } from "@/src/presentation/components/organisms/hotel-portal/painel/timeline/milestone-list";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";

/**
 * Linha do tempo desde o marco zero (§3.6). Unica tela do Painel escopada por
 * tenant e nao por hotel client: a rota e
 * `/admin/hotel-portal/:tenantId/milestones`, entao o id vem do tenant
 * selecionado no dashboard, nao de `useActiveHotelClient`.
 */
export default function HotelEvolucaoPage() {
  const selectedTenant = useTenantStore((s) => s.selectedTenant);
  const tenantId = selectedTenant?.id ? String(selectedTenant.id) : null;

  const { data: milestones, isLoading, isError } = useHotelMilestones(tenantId);

  return (
    <PainelPageShell
      title="Evolução"
      description="A linha do tempo desde a entrada da Reserve — o antes e o depois."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar a linha do tempo."
    >
      {milestones && milestones.length > 0 ? (
        <MilestoneList milestones={milestones} />
      ) : (
        <PortalEmptyState
          title="Nenhum marco registrado ainda"
          description="O marco zero é criado no onboarding; conquistas e recordes entram aqui conforme acontecem."
        />
      )}
    </PainelPageShell>
  );
}
