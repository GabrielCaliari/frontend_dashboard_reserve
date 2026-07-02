import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { MetricLabel } from "@/src/presentation/components/organisms/portal/glossary/metric-label";
import { VariationBadge } from "@/src/presentation/components/organisms/portal/variation-badge";
import { PortalCardSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import type { MetricComparison } from "@/src/modules/portal/domain/portal-stats";
import type { GlossaryKey } from "@/src/modules/portal/domain/glossary";

const COST_METRICS = new Set(["custo_por_conversa"]);

function formatValue(metricKey: string, value: number): string {
  if (metricKey === "investimento" || COST_METRICS.has(metricKey)) {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return value.toLocaleString("pt-BR");
}

export function PortalKpiCards({ metrics, isLoading }: { metrics: MetricComparison[]; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <PortalCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.metric_key} className="space-y-1 p-4">
          <div className="text-sm text-muted-foreground">
            <MetricLabel metricKey={metric.metric_key as GlossaryKey} />
          </div>
          <p className="text-2xl font-semibold">{formatValue(metric.metric_key, metric.current_value)}</p>
          <VariationBadge value={metric.variation_pct} invertColor={COST_METRICS.has(metric.metric_key)} />
        </Card>
      ))}
    </div>
  );
}
