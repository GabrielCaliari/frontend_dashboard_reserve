"use client";

import {
  useActiveHotelClient,
  useHotelSemesterPlans,
} from "@/src/shared/hooks/hotel-portal";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PlanTimelineDesktop } from "@/src/presentation/components/organisms/hotel-portal/painel/plan/plan-timeline-desktop";
import { PlanListMobile } from "@/src/presentation/components/organisms/hotel-portal/painel/plan/plan-list-mobile";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";

export default function HotelPlanoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: plans, isLoading, isError } = useHotelSemesterPlans(
    client?.id ?? null,
  );

  // O backend devolve todos os planos ordenados por semestre desc — o
  // corrente e o primeiro.
  const plan = plans?.[0] ?? null;

  return (
    <PainelPageShell
      title="Plano"
      description={
        plan
          ? `${plan.titulo} · semestre ${plan.semestre}`
          : "O que a Reserve vai entregar neste semestre."
      }
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o plano semestral."
    >
      {plan ? (
        <>
          <div className="hidden md:block">
            <PlanTimelineDesktop plan={plan} />
          </div>
          <div className="md:hidden">
            <PlanListMobile plan={plan} />
          </div>
        </>
      ) : (
        <PortalEmptyState
          title="Nenhum plano publicado ainda"
          description="Assim que a Reserve montar o plano do semestre, ele aparece aqui com as entregas mês a mês."
        />
      )}
    </PainelPageShell>
  );
}
