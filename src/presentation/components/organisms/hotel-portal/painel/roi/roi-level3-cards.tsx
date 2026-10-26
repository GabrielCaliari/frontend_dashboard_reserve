import { BedDouble, Receipt, TrendingUp, Wallet } from "lucide-react";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui/metric-card";
import { formatMoney, formatPercent } from "@/src/shared/utils/hotel-format";
import type { RoiNivel3 } from "@/src/shared/domain/types/@hotel-painel";

/**
 * So renderizado quando o backend devolveu a chave `nivel3` — o que ele so faz
 * com motor de reservas integrado. Regra inegociavel do §3.9: nenhuma receita
 * estimada sem integracao real. O gate mora em quem chama, e o componente
 * nunca inventa numero.
 */
export function RoiLevel3Cards({ data }: { data: RoiNivel3 }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard
        label="Receita atribuída"
        value={formatMoney(data.revenueAttributed.value)}
        icon={Wallet}
        accent
        hint="Reservas confirmadas que começaram num anúncio ou link"
      />
      <MetricCard
        label="Retorno (ROAS)"
        value={`${data.roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x`}
        icon={TrendingUp}
        hint="Receita atribuída ÷ investimento"
      />
      <MetricCard
        label="Ticket médio"
        value={formatMoney(data.avgTicket.value)}
        icon={Receipt}
      />
      <MetricCard
        label="Conversas que viraram reserva"
        value={formatPercent(data.leadToReservationRate)}
        icon={BedDouble}
      />
    </div>
  );
}
