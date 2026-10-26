import { DollarSign, MessageCircle, Target } from "lucide-react";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui/metric-card";
import { formatMoney, formatNumber } from "@/src/shared/utils/hotel-format";
import type { RoiNivel1 } from "@/src/shared/domain/types/@hotel-painel";

/** `Metric.delta` e diferenca absoluta; o card fala em percentual. */
function pctDelta(value: number, previous: number | null): number | null {
  if (previous == null || previous === 0) return null;
  return ((value - previous) / previous) * 100;
}

/**
 * §3.9, regra inegociavel: "custo por conversa em queda e positivo — inverter a
 * logica de cor". O backend ja resolve isso mandando `trendDirection`, entao
 * aqui basta obedecer em vez de reimplementar a regra por metrica.
 */
export function RoiLevel1Cards({ data }: { data: RoiNivel1 }) {
  const { spend, conversas, costPerConversation } = data;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MetricCard
        label="Investimento em anúncios"
        value={formatMoney(spend.value)}
        delta={pctDelta(spend.value, spend.previous)}
        source={spend.source}
        icon={DollarSign}
        accent
      />
      <MetricCard
        label="Conversas geradas"
        value={formatNumber(conversas.value)}
        delta={conversas.delta}
        deltaKind="abs"
        source={conversas.source}
        icon={MessageCircle}
      />
      <MetricCard
        label="Custo por conversa"
        value={formatMoney(costPerConversation.value)}
        delta={pctDelta(costPerConversation.value, costPerConversation.previous)}
        invertDelta
        source={costPerConversation.source}
        icon={Target}
        hint={
          costPerConversation.trendDirection === "improving"
            ? "Em queda: cada conversa está custando menos"
            : "Em alta: cada conversa está custando mais"
        }
      />
    </div>
  );
}
