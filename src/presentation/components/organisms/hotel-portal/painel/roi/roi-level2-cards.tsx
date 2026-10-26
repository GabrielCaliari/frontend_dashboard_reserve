import { BadgeCheck, Handshake, Percent } from "lucide-react";
import { MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui/metric-card";
import { ChannelTable, type ChannelColumn } from "@/src/presentation/components/organisms/hotel-portal/ui/channel-table";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { formatMoney, formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";
import type {
  RoiByCampaignRow,
  RoiNivel2,
} from "@/src/shared/domain/types/@hotel-painel";

const columns: ChannelColumn<RoiByCampaignRow>[] = [
  {
    key: "ad",
    header: "Anúncio",
    cell: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{r.adName ?? `Anúncio ${r.campaignId}`}</span>
        {r.campaignName && (
          <span className="text-xs font-normal text-muted-foreground">{r.campaignName}</span>
        )}
      </span>
    ),
  },
  { key: "conversas", header: "Conversas", align: "right", cell: (r) => formatNumber(r.conversas) },
  { key: "qualificados", header: "Qualificadas", align: "right", cell: (r) => formatNumber(r.qualificados) },
  {
    key: "taxa",
    header: "Taxa",
    align: "right",
    cell: (r) => (r.conversas > 0 ? formatPercent((r.qualificados / r.conversas) * 100, 0) : "—"),
  },
];

export function RoiLevel2Cards({ data }: { data: RoiNivel2 }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <MetricCard
          label="Custo por lead qualificado"
          value={formatMoney(data.costPerQualifiedLead)}
          icon={BadgeCheck}
          hint="Investimento ÷ conversas que o bot qualificou"
        />
        <MetricCard
          label="Custo por lead pronto para fechar"
          value={formatMoney(data.costPerReadyToClose)}
          icon={Handshake}
          hint="Investimento ÷ conversas que chegaram à oferta"
        />
        <MetricCard
          label="Taxa de qualificação"
          value={formatPercent(data.qualificationRate)}
          icon={Percent}
          hint="Das conversas iniciadas, quantas o bot qualificou"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Por anúncio</h3>
        {data.roiByCampaign.length === 0 ? (
          <PortalEmptyState
            title="Nenhuma conversa veio de anúncio no período"
            description="Quando alguém clicar em um anúncio e falar com o bot, o anúncio aparece aqui."
          />
        ) : (
          <ChannelTable columns={columns} rows={data.roiByCampaign} getRowKey={(r) => r.campaignId} />
        )}
      </div>
    </div>
  );
}
