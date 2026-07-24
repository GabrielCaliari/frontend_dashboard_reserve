import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { MetricLabel } from "@/src/presentation/components/organisms/portal/glossary/metric-label";
import type { TrafficResponse } from "@/src/modules/portal/domain/portal-traffic";
import type { GlossaryKey } from "@/src/modules/portal/domain/glossary";

const ROWS: { key: GlossaryKey; format: (v: number) => string }[] = [
  { key: "investimento", format: (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
  { key: "pessoas_alcancadas", format: (v) => v.toLocaleString("pt-BR") },
  { key: "visualizacoes", format: (v) => v.toLocaleString("pt-BR") },
  { key: "conversas_iniciadas", format: (v) => v.toLocaleString("pt-BR") },
  { key: "custo_por_conversa", format: (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) },
  { key: "frequencia", format: (v) => v.toFixed(1) },
];

export function TrafficMetrics({
  metrics,
  googleAds,
}: {
  metrics: TrafficResponse["headline_metrics"];
  googleAds?: TrafficResponse["google_ads"];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      {ROWS.map((row) => (
        <Card key={row.key} className="space-y-1 p-4">
          <div className="text-sm text-muted-foreground">
            <MetricLabel metricKey={row.key} />
          </div>
          <p className="text-xl font-semibold">{row.format(metrics[row.key as keyof TrafficResponse["headline_metrics"]])}</p>
        </Card>
      ))}
      {googleAds && (
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Google Ads</p>
          <p className="text-xl font-semibold">
            {googleAds.investimento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-muted-foreground">{googleAds.cliques} cliques</p>
        </Card>
      )}
    </div>
  );
}
