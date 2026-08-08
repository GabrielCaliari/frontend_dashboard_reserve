import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { VariationBadge } from "@/src/presentation/components/organisms/hotel-portal/painel/variation-badge";
import { formatMoney } from "@/src/shared/utils/hotel-format";
import type { RoiNivel1 } from "@/src/shared/domain/types/@hotel-painel";

/**
 * §3.9, regra inegociavel: "custo por conversa em queda e positivo — inverter a
 * logica de cor". O backend ja resolve isso mandando `trendDirection`, entao
 * aqui basta obedecer em vez de reimplementar a regra por metrica.
 */
export function RoiLevel1Cards({ data }: { data: RoiNivel1 }) {
  const { spend, conversas, costPerConversation } = data;

  // `delta` do backend e diferenca absoluta; a badge fala em percentual.
  const custoVariationPct =
    costPerConversation.previous && costPerConversation.previous !== 0
      ? ((costPerConversation.value - costPerConversation.previous) /
          costPerConversation.previous) *
        100
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Investimento total</p>
        <p className="text-xl font-semibold">{formatMoney(spend.value)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Conversas geradas</p>
        <p className="text-xl font-semibold">{conversas.value}</p>
      </Card>
      <Card className="space-y-1 p-4">
        <p className="text-sm text-muted-foreground">Custo por conversa</p>
        <p className="text-xl font-semibold">
          {formatMoney(costPerConversation.value)}
        </p>
        <VariationBadge value={custoVariationPct} invertColor />
        <p className="text-xs text-muted-foreground">
          {costPerConversation.trendDirection === "improving"
            ? "em queda — está melhorando"
            : "em alta — atenção"}
        </p>
      </Card>
    </div>
  );
}
