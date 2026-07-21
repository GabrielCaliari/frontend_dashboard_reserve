import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { DeliveryStatus, SemesterPlan } from "@/src/modules/portal/domain/portal-plan";

const statusColor: Record<DeliveryStatus, string> = {
  planejado: "border-border",
  em_andamento: "border-amber-500",
  concluido: "border-emerald-500",
};

/**
 * The `overflow-x-auto` below is a deliberate, contained horizontal scroll
 * region for this desktop-only month-columns scroller — not the "no
 * horizontal scroll" mobile violation Global Constraints forbids (that rule
 * targets the 375px mobile experience, where `<PlanListMobile>` renders
 * instead of this component).
 */
export function PlanTimelineDesktop({ plan }: { plan: SemesterPlan }) {
  const months = Array.from(new Set(plan.entregas.map((e) => e.mes))).sort();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {plan.eixos.map((eixo) => (
          <span key={eixo} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
            {eixo}
          </span>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {months.map((mes) => (
          <div key={mes} className="min-w-48 flex-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{mes}</p>
            {plan.entregas
              .filter((e) => e.mes === mes)
              .map((entrega) => (
                <Card key={entrega.id} className={`border-l-4 p-3 ${statusColor[entrega.status]}`}>
                  <p className="text-sm font-medium">{entrega.titulo}</p>
                </Card>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
