"use client";

import { Flag } from "lucide-react";
import { useHotelMilestones } from "@/src/shared/hooks/hotel-portal";
import { useTenantStore } from "@/src/shared/stores/tenant-store";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { MilestoneList } from "@/src/presentation/components/organisms/hotel-portal/painel/timeline/milestone-list";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";

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

  const marcoZero = milestones?.find((m) => m.type === "marco_zero");
  const desde = marcoZero
    ? new Date(marcoZero.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <PainelPageShell
      title="Evolução"
      description={
        desde
          ? `Os marcos da pousada desde ${desde}, quando a RÉSERVE entrou: recordes, campanhas e conquistas, do mais recente ao primeiro dia.`
          : "Os marcos da pousada desde a entrada da RÉSERVE: recordes, campanhas e conquistas, do mais recente ao primeiro dia."
      }
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar a linha do tempo."
    >
      {milestones && milestones.length > 0 ? (
        <div className="max-w-3xl">
          <MilestoneList milestones={milestones} />
        </div>
      ) : (
        <PortalEmptyState
          icon={Flag}
          title="Nenhum marco registrado ainda"
          description="O marco zero é criado no onboarding; conquistas e recordes entram aqui conforme acontecem."
        />
      )}

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/reports", label: "Relatório mensal", hint: "A leitura mês a mês" },
          { href: "/dashboard/hotel/atividades", label: "Atividades", hint: "Tudo o que a RÉSERVE fez, dia a dia" },
        ]}
      />
    </PainelPageShell>
  );
}
