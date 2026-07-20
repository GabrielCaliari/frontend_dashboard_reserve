import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import type { DeliveryStatus, SemesterPlan } from "@/src/modules/portal/domain/portal-plan";

const statusLabel: Record<DeliveryStatus, string> = {
  planejado: "planejado",
  em_andamento: "em andamento",
  concluido: "concluído",
};

export function PlanListMobile({ plan }: { plan: SemesterPlan }) {
  const byMonth = new Map<string, typeof plan.entregas>();
  plan.entregas.forEach((entrega) => {
    byMonth.set(entrega.mes, [...(byMonth.get(entrega.mes) ?? []), entrega]);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {plan.eixos.map((eixo) => (
          <span key={eixo} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium">
            {eixo}
          </span>
        ))}
      </div>
      {Array.from(byMonth.entries()).map(([mes, entregas]) => (
        <div key={mes}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{mes}</p>
          <div className="space-y-2">
            {entregas.map((entrega) => (
              <Card key={entrega.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entrega.titulo}</p>
                  <span className="text-xs text-muted-foreground">{statusLabel[entrega.status]}</span>
                </div>
                <p className="text-sm text-muted-foreground">{entrega.descricao}</p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
