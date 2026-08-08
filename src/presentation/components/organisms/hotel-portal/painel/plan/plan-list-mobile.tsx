import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type {
  SemesterPlan,
  SemesterPlanDelivery,
  SemesterPlanDeliveryStatus,
} from "@/src/shared/domain/types/@hotel-painel";
import { normalizeEixos } from "./eixos";

const statusLabel: Record<SemesterPlanDeliveryStatus, string> = {
  planejado: "planejado",
  em_andamento: "em andamento",
  concluido: "concluído",
};

export function PlanListMobile({ plan }: { plan: SemesterPlan }) {
  const byMonth = new Map<number, SemesterPlanDelivery[]>();
  plan.Deliveries.forEach((entrega) => {
    byMonth.set(entrega.mes, [...(byMonth.get(entrega.mes) ?? []), entrega]);
  });

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
      {[...byMonth.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([mes, entregas]) => (
          <div key={mes}>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Mês {mes}
            </p>
            <div className="space-y-2">
              {entregas.map((entrega) => (
                <Card key={entrega.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{entrega.titulo}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {statusLabel[entrega.status] ?? entrega.status}
                    </span>
                  </div>
                  {entrega.descricao && (
                    <p className="text-sm text-muted-foreground">
                      {entrega.descricao}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
