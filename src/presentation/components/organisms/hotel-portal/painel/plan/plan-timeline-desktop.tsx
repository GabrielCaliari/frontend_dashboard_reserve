import type { SemesterPlan } from "@/src/shared/domain/types/@hotel-painel";
import { normalizeEixos } from "./eixos";
import { planStatus } from "./plan-status";

/**
 * O `overflow-x-auto` abaixo e uma regiao de rolagem horizontal deliberada e
 * contida (colunas de mes), so no desktop — nao a violacao de "sem scroll
 * horizontal" no mobile, onde quem renderiza e `<PlanListMobile>`.
 */
export function PlanTimelineDesktop({ plan }: { plan: SemesterPlan }) {
  const meses = [...new Set(plan.Deliveries.map((e) => e.mes))].sort(
    (a, b) => a - b,
  );
  const eixos = normalizeEixos(plan.eixos);

  return (
    <div className="space-y-5">
      {eixos.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          Frentes do semestre:
          {eixos.map((eixo) => (
            <span
              key={eixo}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
            >
              {eixo}
            </span>
          ))}
        </p>
      )}
      <ol className="flex gap-3 overflow-x-auto pb-2">
        {meses.map((mes) => {
          const entregas = plan.Deliveries.filter((e) => e.mes === mes).sort((a, b) => a.ordem - b.ordem);
          const feitas = entregas.filter((e) => e.status === "concluido").length;
          return (
            <li key={mes} className="flex min-w-56 flex-1 flex-col gap-2">
              <div className="flex items-baseline justify-between border-b border-border/80 pb-2">
                <p className="font-display text-base font-semibold text-foreground">Mês {mes}</p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {feitas}/{entregas.length}
                </p>
              </div>
              {entregas.map((entrega) => {
                const st = planStatus(entrega.status);
                return (
                  <article
                    key={entrega.id}
                    className="flex gap-3 rounded-2xl border border-border/80 bg-default-50 p-3"
                  >
                    <span aria-hidden className={`mt-0.5 w-1 shrink-0 self-stretch rounded-full ${st.bar}`} />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-medium text-foreground">{entrega.titulo}</p>
                      {entrega.descricao && (
                        <p className="text-xs leading-relaxed text-muted-foreground">{entrega.descricao}</p>
                      )}
                      <span className={`inline-flex rounded-md px-1.5 py-px text-[11px] font-medium ${st.chip}`}>
                        {st.label}
                      </span>
                    </div>
                  </article>
                );
              })}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
