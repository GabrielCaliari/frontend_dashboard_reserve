"use client";

import { useMemo, useState } from "react";
import { DollarSign, MessageCircle, Target, TrendingUp } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelPortalOverview,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalLineChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/line-chart";
import { CHART_COLORS } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/chart-theme";
import {
  DateRangeFilter,
  MONTH_PRESETS,
  currentMonth,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";
import {
  MetricCard,
  ChannelTable,
  type ChannelColumn,
} from "@/src/presentation/components/organisms/hotel-portal/ui";
import { formatDayMonth, formatMoney, formatNumber } from "@/src/shared/utils/hotel-format";

const CHANNEL_LABELS: Record<string, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  google_hotel_ads: "Google Hotel Ads",
  remarketing: "Remarketing",
};

const roasLabel = (roas: number | null | undefined) =>
  roas ? `${roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x` : "—";

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
  const [period, setPeriod] = useState<DateRange>(currentMonth);

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
      header: "Retorno (ROAS)",
      align: "right",
      cell: (c) => roasLabel(c.roas),
    },
  ];

  const dailySpend = useMemo(
    () =>
      data?.timeseries?.map((p) => ({
        date: formatDayMonth(p.date),
        investimento: p.spend / 100,
      })) ?? [],
    [data],
  );

  const totalRevenue = channelRows.reduce((s, c) => s + c.attributedRevenue, 0);

  return (
    <PainelPageShell
      title="Tráfego pago"
      description="Quanto foi investido em anúncios no período e o que voltou disso: receita atribuída, custo por reserva e conversas iniciadas no WhatsApp."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar os dados de tráfego."
      actions={<DateRangeFilter value={period} onChange={setPeriod} presets={MONTH_PRESETS} />}
    >
      {media && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Investimento"
            value={formatMoney(media.spend?.value)}
            icon={DollarSign}
            accent
          />
          <MetricCard
            label="Retorno (ROAS)"
            value={roasLabel(media.roas?.value)}
            delta={media.roas?.delta}
            source={media.roas?.source}
            icon={TrendingUp}
            hint="Receita atribuída ÷ investimento"
          />
          <MetricCard
            label="Custo por reserva"
            value={formatMoney(media.costPerBooking?.value)}
            source={media.costPerBooking?.source}
            icon={Target}
            invertDelta
          />
          <MetricCard
            label="Cliques em links rastreáveis"
            value={data?.whatsapp ? formatNumber(data.whatsapp.clicks.value) : "—"}
            delta={data?.whatsapp?.clicks.delta}
            deltaKind="abs"
            source={data?.whatsapp?.clicks.source}
            icon={MessageCircle}
            hint="Links de WhatsApp da bio, do site e do Google"
          />
        </div>
      )}

      <PainelSection
        title="Investimento por dia"
        description="Cada ponto é o que foi gasto nas plataformas naquele dia."
      >
        <PortalLineChart
          data={dailySpend}
          xKey="date"
          series={[{ key: "investimento", label: "Investimento", color: CHART_COLORS.primary }]}
          valueFormatter={(v) => formatMoney(Math.round(v * 100))}
        />
      </PainelSection>

      {channelRows.length > 0 && (
        <PainelSection title="Por canal">
          <ChannelTable
            columns={channelColumns}
            rows={channelRows}
            getRowKey={(c) => c.channel}
            footer={[
              "Total",
              formatMoney(media?.spend?.value),
              formatMoney(totalRevenue),
              roasLabel(media?.roas?.value),
            ]}
          />
        </PainelSection>
      )}

      <ScreenLinks
        links={[
          {
            href: "/dashboard/hotel/campaigns",
            label: "Campanhas",
            hint: "Campanha a campanha, com conversas por anúncio",
          },
          {
            href: "/dashboard/hotel/retorno",
            label: "Retorno (ROI)",
            hint: "Custo por conversa, por lead qualificado e receita",
          },
          {
            href: "/dashboard/hotel/atendimento",
            label: "Atendimento",
            hint: "O que o bot fez com as conversas que os anúncios trouxeram",
          },
        ]}
      />
    </PainelPageShell>
  );
}
