import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type {
  SemesterPlan,
  SemesterPlanDeliveryStatus,
} from "@/src/shared/domain/types/@hotel-painel";
import { normalizeEixos } from "./eixos";

const statusColor: Record<SemesterPlanDeliveryStatus, string> = {
  planejado: "border-border",
  em_andamento: "border-amber-500",
  concluido: "border-emerald-500",
};

/**
 * O `overflow-x-auto` abaixo e uma regiao de rolagem horizontal deliberada e
 * contida (colunas de mes), so no desktop — nao a violacao de "sem scroll
 * horizontal" no mobile, onde quem renderiza e `<PlanListMobile>`.
 */
export function PlanTimelineDesktop({ plan }: { plan: SemesterPlan }) {
  const meses = [...new Set(plan.Deliveries.map((e) => e.mes))].sort(
    (a, b) => a - b,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {normalizeEixos(plan.eixos).map((eixo) => (
          <span
            key={eixo}
            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium"
          >
            {eixo}
          </span>
        ))}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {meses.map((mes) => (
          <div key={mes} className="min-w-48 flex-1 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Mês {mes}
            </p>
            {plan.Deliveries.filter((e) => e.mes === mes).map((entrega) => (
              <Card
                key={entrega.id}
                className={`border-l-4 p-3 ${statusColor[entrega.status] ?? "border-border"}`}
              >
                <p className="text-sm font-medium">{entrega.titulo}</p>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
