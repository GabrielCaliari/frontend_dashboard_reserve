import { useMemo } from "react";
import { PortalBarChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/bar-chart";
import type { FunnelMetricsResponse } from "@/src/shared/domain/types/@hotel-painel";

/**
 * O backend devolve linhas cruas (`tipoJanela` x `status` x `count`). Agrupar
 * por janela e derivar o percentual de resposta e trabalho de apresentacao,
 * feito aqui — o backend nao manda percentual pronto para este bloco.
 */
export function FollowupEffectivenessChart({
  data,
}: {
  data: FunnelMetricsResponse["efetividadeFollowup"];
}) {
  const rows = useMemo(() => {
    const byJanela = new Map<string, { total: number; respondeu: number }>();
    for (const row of data) {
      const entry = byJanela.get(row.tipoJanela) ?? { total: 0, respondeu: 0 };
      entry.total += row.count;
      if (row.status?.toUpperCase() === "RESPONDIDO") entry.respondeu += row.count;
      byJanela.set(row.tipoJanela, entry);
    }
    return [...byJanela.entries()].map(([toque, v]) => ({
      toque,
      respondeu_pct: v.total ? Math.round((v.respondeu / v.total) * 1000) / 10 : 0,
    }));
  }, [data]);

  return (
    <PortalBarChart
      data={rows}
      xKey="toque"
      series={[
        { key: "respondeu_pct", label: "Responderam (%)", color: "#0ea5e9" },
      ]}
    />
  );
}
