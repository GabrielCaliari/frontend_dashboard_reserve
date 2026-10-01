import type { LeadsOverviewResponse } from "@/src/shared/domain/types/@hotel-painel";

function pct(parte: number, todo: number): number {
  return todo > 0 ? Math.round((parte / todo) * 1000) / 10 : 0;
}

/**
 * Fecha o ciclo dos links rastreaveis (contrato v2 §4.6): quem clicou, quem
 * de fato abriu conversa com o bot e quem reservou. Os tres numeros sao do
 * mesmo periodo.
 */
export function LinkCycleStrip({ ciclo }: { ciclo: NonNullable<LeadsOverviewResponse["ciclo"]> }) {
  const passos = [
    { label: "Cliques nos links", valor: ciclo.cliques, taxa: null as string | null },
    { label: "Conversas iniciadas", valor: ciclo.conversas, taxa: `${pct(ciclo.conversas, ciclo.cliques)}% dos cliques` },
    { label: "Reservas confirmadas", valor: ciclo.reservas, taxa: `${pct(ciclo.reservas, ciclo.conversas)}% das conversas` },
  ];

  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {passos.map((passo) => (
        <li key={passo.label} className="rounded-3xl border border-border bg-default-50 p-5">
          <p className="text-sm text-foreground/60">{passo.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{passo.valor}</p>
          {passo.taxa ? <p className="mt-1 text-xs text-foreground/50">{passo.taxa}</p> : null}
        </li>
      ))}
    </ol>
  );
}
