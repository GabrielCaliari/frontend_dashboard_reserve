"use client";

import { ClipboardList } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelSemesterPlans,
} from "@/src/shared/hooks/hotel-portal";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PlanTimelineDesktop } from "@/src/presentation/components/organisms/hotel-portal/painel/plan/plan-timeline-desktop";
import { PlanListMobile } from "@/src/presentation/components/organisms/hotel-portal/painel/plan/plan-list-mobile";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";

export default function HotelPlanoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const { data: plans, isLoading, isError } = useHotelSemesterPlans(
    client?.id ?? null,
  );

  // O backend devolve todos os planos ordenados por semestre desc — o
  // corrente e o primeiro.
  const plan = plans?.[0] ?? null;
  const total = plan?.Deliveries.length ?? 0;
  const feitas = plan?.Deliveries.filter((e) => e.status === "concluido").length ?? 0;
  const andamento = plan?.Deliveries.filter((e) => e.status === "em_andamento").length ?? 0;

  return (
    <PainelPageShell
      title={plan ? plan.titulo : "Plano"}
      description={
        plan
          ? `Semestre ${plan.semestre}: ${total} entregas previstas, ${feitas} concluídas e ${andamento} em andamento.`
          : "O que a RÉSERVE vai entregar neste semestre, mês a mês."
      }
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o plano semestral."
    >
      {plan ? (
        <>
          {total > 0 && (
            <div className="max-w-3xl space-y-1.5">
              <div className="flex h-2 overflow-hidden rounded-full bg-default-100" aria-hidden>
                <span className="bg-success" style={{ width: `${(feitas / total) * 100}%` }} />
                <span className="bg-warning" style={{ width: `${(andamento / total) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((feitas / total) * 100)}% do plano concluído
              </p>
            </div>
          )}
          <div className="hidden md:block">
            <PlanTimelineDesktop plan={plan} />
          </div>
          <div className="md:hidden">
            <PlanListMobile plan={plan} />
          </div>
        </>
      ) : (
        <PortalEmptyState
          icon={ClipboardList}
          title="Nenhum plano publicado ainda"
          description="Assim que a RÉSERVE montar o plano do semestre, ele aparece aqui com as entregas mês a mês."
        />
      )}

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/atividades", label: "Atividades", hint: "O que já foi feito, dia a dia" },
          { href: "/dashboard/hotel/reports", label: "Relatório mensal", hint: "O resultado de cada mês do plano" },
        ]}
      />
    </PainelPageShell>
  );
}
