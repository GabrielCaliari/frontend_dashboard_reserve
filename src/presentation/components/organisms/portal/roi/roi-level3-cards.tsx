import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
import { LockedFeatureCard } from "@/src/presentation/components/organisms/portal/locked-feature-card";
import type { RoiLevel3 } from "@/src/modules/portal/domain/portal-roi";

const currency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** `data.unlocked` gates real numbers vs. the upsell card by construction — never a guessed revenue figure. */
export function RoiLevel3Cards({ data }: { data: RoiLevel3 }) {
  if (!data.unlocked) {
    return (
      <LockedFeatureCard
        title="Receita atribuída, ROAS e ticket médio"
        description="Disponível quando o motor de reservas do seu site estiver integrado ao painel — fale com a Reserve para ativar."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Receita atribuída</p>
        <p className="text-xl font-semibold">{currency(data.receita_atribuida!)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">ROAS</p>
        <p className="text-xl font-semibold">{data.roas}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Ticket médio</p>
        <p className="text-xl font-semibold">{currency(data.ticket_medio!)}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Taxa de conversão lead → reserva</p>
        <p className="text-xl font-semibold">{data.taxa_conversao_lead_reserva_pct}%</p>
      </Card>
    </div>
  );
}
