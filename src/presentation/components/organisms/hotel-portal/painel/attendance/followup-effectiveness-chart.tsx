import { useMemo } from "react";
import { PortalBarChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/bar-chart";
import type { FunnelMetricsResponse } from "@/src/shared/domain/types/@hotel-painel";

/** Reguas de follow-up do bot (contrato v2 §3.5): por origem do contato ou por momento da venda. */
const REGUA_LABELS: Record<string, string> = {
  anuncio: "Anúncio (72h)",
  organico: "Orgânico (24h)",
  pre_reserva: "Pré-reserva",
  pagamento: "Pagamento",
};

/**
 * O backend devolve linhas cruas (`regua` x `status` x `count`). Agrupar por
 * regua e derivar o percentual de resposta e trabalho de apresentacao, feito
 * aqui. "Respondeu" = o hospede mandou mensagem depois do toque.
 */
export function summarizeFollowup(
  data: FunnelMetricsResponse["efetividadeFollowup"],
): { regua: string; respondeu_pct: number }[] {
  const porRegua = new Map<string, { total: number; respondeu: number }>();
  for (const row of data) {
    const entry = porRegua.get(row.regua) ?? { total: 0, respondeu: 0 };
    entry.total += row.count;
    if (row.status === "respondeu") entry.respondeu += row.count;
    porRegua.set(row.regua, entry);
  }
  return [...porRegua.entries()].map(([regua, v]) => ({
    regua: REGUA_LABELS[regua] ?? regua,
    respondeu_pct: v.total ? Math.round((v.respondeu / v.total) * 1000) / 10 : 0,
  }));
}

export function FollowupEffectivenessChart({
  data,
}: {
  data: FunnelMetricsResponse["efetividadeFollowup"];
}) {
  const rows = useMemo(() => summarizeFollowup(data), [data]);

  return (
    <PortalBarChart
      data={rows}
      xKey="regua"
      series={[{ key: "respondeu_pct", label: "Responderam (%)", color: "#0ea5e9" }]}
    />
  );
}
