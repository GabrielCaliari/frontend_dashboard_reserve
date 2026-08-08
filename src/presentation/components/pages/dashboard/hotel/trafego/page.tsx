"use client";

import { useMemo, useState } from "react";
import { TrendingUp, DollarSign, Target } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelPortalOverview,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalLineChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/line-chart";
import {
  MetricCard,
  ChannelTable,
  PeriodPicker,
  type ChannelColumn,
} from "@/src/presentation/components/organisms/hotel-portal/ui";
import {
  resolvePreset,
  type PeriodPreset,
} from "@/src/presentation/components/organisms/hotel-portal/ui/period-picker";
import { formatMoney, formatDayMonth } from "@/src/shared/utils/hotel-format";

const CHANNEL_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  google_hotel_ads: "Google Hotel Ads",
  remarketing: "Remarketing",
};

/**
 * Trafego Pago = a visao AGREGADA da midia, tirada da secao `media` do
 * endpoint de overview (investimento, ROAS, custo por reserva, quebra por
 * canal) mais a serie diaria de investimento.
 *
 * Nao confundir com a tela Campanhas, que lista campanha a campanha
 * (`/hotel-portal/:clientId/campaigns`). Sao dois recortes de dado real e
 * endpoints distintos — nenhum dos dois foi inventado para preencher o menu.
 */
export default function HotelTrafegoPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [preset, setPreset] = useState<PeriodPreset>("current-month");
  const period = useMemo(() => resolvePreset(preset), [preset]);

  const { data, isLoading, isError } = useHotelPortalOverview(
    client?.id ?? null,
    period,
  );

  const media = data?.media;

  const channelRows = media?.byChannel ?? [];

  const channelColumns: ChannelColumn<(typeof channelRows)[number]>[] = [
    {
      key: "channel",
      header: "Canal",
      cell: (c) => CHANNEL_LABELS[c.channel] ?? c.channel,
    },
    {
      key: "spend",
      header: "Investimento",
      align: "right",
      cell: (c) => formatMoney(c.spend),
    },
    {
      key: "attributedRevenue",
      header: "Receita atribuída",
      align: "right",
      cell: (c) => formatMoney(c.attributedRevenue),
    },
    {
      key: "roas",
      header: "ROAS",
      align: "right",
      cell: (c) => (c.roas ? `${c.roas.toFixed(2)}x` : "—"),
    },
  ];

  const dailySpend =
    data?.timeseries?.map((p) => ({
      date: formatDayMonth(p.date),
      investimento: p.spend / 100,
    })) ?? [];

  return (
    <PainelPageShell
      title="Tráfego Pago"
      description="Quanto foi investido em mídia no período e o que voltou disso."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os dados de tráfego."
      actions={<PeriodPicker preset={preset} onChange={(p) => setPreset(p)} />}
    >
      {media && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <MetricCard
            label="Investimento"
            value={formatMoney(media.spend?.value)}
            icon={DollarSign}
            accent
          />
          <MetricCard
            label="ROAS"
            value={media.roas?.value ? `${media.roas.value.toFixed(2)}x` : "—"}
            delta={media.roas?.delta}
            source={media.roas?.source}
            icon={TrendingUp}
          />
          <MetricCard
            label="Custo por reserva"
            value={formatMoney(media.costPerBooking?.value)}
            source={media.costPerBooking?.source}
            icon={Target}
            invertDelta
          />
        </div>
      )}

      <PainelSection title="Investimento por dia">
        <PortalLineChart
          data={dailySpend}
          xKey="date"
          series={[
            { key: "investimento", label: "Investimento (R$)", color: "#0ea5e9" },
          ]}
        />
      </PainelSection>

      {channelRows.length > 0 && (
        <PainelSection title="Por canal">
          <ChannelTable
            columns={channelColumns}
            rows={channelRows}
            getRowKey={(c) => c.channel}
          />
        </PainelSection>
      )}
    </PainelPageShell>
  );
}
