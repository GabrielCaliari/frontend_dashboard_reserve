import { Card } from "@/src/presentation/components/atoms/shadcn-ui/card";
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Receita atribuída</p>
        <p className="text-xl font-semibold">
          {formatMoney(data.revenueAttributed.value)}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">ROAS</p>
        <p className="text-xl font-semibold">{data.roas}</p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">Ticket médio</p>
        <p className="text-xl font-semibold">
          {formatMoney(data.avgTicket.value)}
        </p>
      </Card>
      <Card className="p-4">
        <p className="text-sm text-muted-foreground">
          Taxa de conversão lead → reserva
        </p>
        <p className="text-xl font-semibold">
          {formatPercent(data.leadToReservationRate)}
        </p>
      </Card>
    </div>
  );
}
