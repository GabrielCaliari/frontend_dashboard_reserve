import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { VariationBadge } from "@/src/presentation/components/organisms/portal/variation-badge";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import type { RoiLevel1 } from "@/src/modules/portal/domain/portal-roi";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Master doc §3.9 inegociável: "custo por conversa em queda é positivo —
 * inverter a lógica de cor" — handled by VariationBadge's `invertColor`.
 */
export function RoiLevel1Cards({ data }: { data: RoiLevel1 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Investimento total</p>
          <p className="text-xl font-semibold">{currency(data.investimento_total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Conversas geradas</p>
          <p className="text-xl font-semibold">{data.conversas_geradas}</p>
        </Card>
        <Card className="space-y-1 p-4">
          <p className="text-sm text-muted-foreground">Custo por conversa</p>
          <p className="text-xl font-semibold">{currency(data.custo_por_conversa)}</p>
          <VariationBadge value={data.custo_por_conversa_variation_pct} invertColor />
        </Card>
      </div>
      <div>
        <h3 className="mb-2 text-xs text-muted-foreground">Evolução do custo por conversa</h3>
        <PortalLineChart
          data={data.custo_por_conversa_history}
          xKey="date"
          series={[{ key: "custo_por_conversa", label: "Custo por conversa", color: "#0ea5e9" }]}
        />
      </div>
    </div>
  );
}
