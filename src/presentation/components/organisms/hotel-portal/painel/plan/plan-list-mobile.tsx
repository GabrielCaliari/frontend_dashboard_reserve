import type {
  SemesterPlan,
  SemesterPlanDelivery,
} from "@/src/shared/domain/types/@hotel-painel";
import { normalizeEixos } from "./eixos";
import { planStatus } from "./plan-status";

export function PlanListMobile({ plan }: { plan: SemesterPlan }) {
  const byMonth = new Map<number, SemesterPlanDelivery[]>();
  plan.Deliveries.forEach((entrega) => {
    byMonth.set(entrega.mes, [...(byMonth.get(entrega.mes) ?? []), entrega]);
  });
  const eixos = normalizeEixos(plan.eixos);

  return (
    <div className="space-y-5">
      {eixos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {eixos.map((eixo) => (
            <span
              key={eixo}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
            >
              {eixo}
            </span>
          ))}
        </div>
      )}
      {[...byMonth.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([mes, entregas]) => {
          const feitas = entregas.filter((e) => e.status === "concluido").length;
          return (
            <section key={mes}>
              <div className="mb-2 flex items-baseline justify-between border-b border-border/80 pb-2">
                <p className="font-display text-base font-semibold text-foreground">Mês {mes}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {feitas}/{entregas.length}
                </p>
              </div>
              <ul className="space-y-2">
                {[...entregas]
                  .sort((a, b) => a.ordem - b.ordem)
                  .map((entrega) => {
                    const st = planStatus(entrega.status);
                    return (
                      <li
                        key={entrega.id}
                        className="flex gap-3 rounded-2xl border border-border/80 bg-default-50 p-3"
                      >
                        <span aria-hidden className={`w-1 shrink-0 self-stretch rounded-full ${st.bar}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{entrega.titulo}</p>
                            <span className={`shrink-0 rounded-md px-1.5 py-px text-[11px] font-medium ${st.chip}`}>
                              {st.label}
                            </span>
                          </div>
                          {entrega.descricao && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {entrega.descricao}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
