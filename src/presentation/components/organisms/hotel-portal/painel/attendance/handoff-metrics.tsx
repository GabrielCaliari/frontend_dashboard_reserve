"use client";

import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type { FunnelMetricsResponse } from "@/src/shared/domain/types/@hotel-painel";

function formatSeconds(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${(seconds / 3600).toFixed(1).replace(".", ",")} h`;
}

/** "pediu_humano" -> "pediu humano": o motivo vem do bot em snake_case. */
function motivoLabel(motivo: string): string {
  return motivo.replace(/_/g, " ");
}

/**
 * Ciclo bot -> humano (benchmark §5 passo 8): quantas conversas o bot
 * escalou, por que, e quanto tempo segurou antes. Leitura pura: os dados vem
 * das anotacoes HANDOFF do log do funil.
 */
export function HandoffMetrics({ handoff }: { handoff: FunnelMetricsResponse["handoff"] }) {
  if (handoff.total === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma transferência para humano no período — o bot resolveu tudo sozinho.
      </p>
    );
  }
  const maior = handoff.motivos[0]?.count ?? 1;
  return (
    <div className="grid gap-3 lg:grid-cols-[repeat(3,minmax(0,1fr))_1.4fr]">
      <MetricCard label="Transferências" value={formatNumber(handoff.total)} />
      <MetricCard
        label="Taxa de handover"
        value={formatPercent(handoff.taxaHandover * 100, 0)}
        hint="transferências ÷ conversas iniciadas"
      />
      <MetricCard
        label="Tempo com o bot"
        value={formatSeconds(handoff.tempoMedioComBotSegundos)}
        hint="do 1º contato até a transferência"
      />
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Motivos</p>
        <ul className="space-y-1.5">
          {handoff.motivos.map((m) => (
            <li key={m.motivo} className="text-sm">
              <span className="flex items-baseline justify-between gap-2">
                <span className="truncate capitalize">{motivoLabel(m.motivo)}</span>
                <span className="text-xs text-muted-foreground">{formatNumber(m.count)}</span>
              </span>
              <span className="mt-0.5 block h-1 rounded-full bg-default-100">
                <span
                  className="block h-1 rounded-full bg-warning"
                  style={{ width: `${Math.max(6, Math.round((m.count / maior) * 100))}%` }}
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
