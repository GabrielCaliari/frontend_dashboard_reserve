"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelFunnelMetrics,
  useHotelPortalCampaigns,
  useHotelRoi,
} from "@/src/shared/hooks/hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import {
  DateRangeFilter,
  MONTH_PRESETS,
  currentMonth,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";
import { ChannelTable, type ChannelColumn } from "@/src/presentation/components/organisms/hotel-portal/ui";
import type {
  CampaignMetricItem,
  CampaignSummary,
  ECampaignChannel,
} from "@/src/shared/domain/types/@hotel-portal";
import type { RoiByCampaignRow } from "@/src/shared/domain/types/@hotel-painel";

const CHANNEL_LABELS: Record<ECampaignChannel, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  GOOGLE_HOTEL_ADS: "Google Hotel Ads",
  REMARKETING: "Remarketing",
};

const CHANNEL_TONE: Record<ECampaignChannel, string> = {
  META_ADS: "bg-primary",
  GOOGLE_ADS: "bg-warning",
  GOOGLE_HOTEL_ADS: "bg-success",
  REMARKETING: "bg-foreground/40",
};

// Este endpoint manda dinheiro em REAIS (campaign_metrics), nao em centavos.
const reais = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const inteiro = (n: number) => new Intl.NumberFormat("pt-BR").format(n);
const roasLabel = (roas: number | null | undefined) =>
  roas ? `${roas.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}x` : "—";

function channelLabel(channel: string) {
  return CHANNEL_LABELS[channel as ECampaignChannel] ?? channel;
}

function ChannelDot({ channel }: { channel: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block size-2 shrink-0 rounded-full ${
        CHANNEL_TONE[channel as ECampaignChannel] ?? "bg-foreground/40"
      }`}
    />
  );
}

/** Resumo de um canal: o investimento grande, o resto em pares. */
function ChannelSummaryCard({ s }: { s: CampaignSummary }) {
  return (
    <article className="rounded-2xl border border-border/80 bg-default-50 p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ChannelDot channel={s.channel} />
        {channelLabel(s.channel)}
      </p>
      <p className="mt-3 font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-foreground [overflow-wrap:normal] [word-break:keep-all]">
        {reais(s.total_spend)}
      </p>
      <p className="text-sm text-muted-foreground">investidos</p>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border/60 pt-4 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Cliques</dt>
          <dd className="font-medium tabular-nums">{inteiro(s.total_clicks)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Conversas</dt>
          <dd className="font-medium tabular-nums">{inteiro(s.total_conversions)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Retorno</dt>
          <dd className="font-medium tabular-nums">{roasLabel(s.avg_roas)}</dd>
        </div>
      </dl>
    </article>
  );
}

const campaignColumns: ChannelColumn<CampaignMetricItem>[] = [
  {
    key: "campaign",
    header: "Campanha",
    cell: (m) => (
      <span className="flex items-center gap-2">
        <ChannelDot channel={m.channel} />
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{m.campaign_name}</span>
          <span className="text-xs font-normal text-muted-foreground">{channelLabel(m.channel)}</span>
        </span>
      </span>
    ),
  },
  { key: "spend", header: "Investimento", align: "right", cell: (m) => reais(m.spend) },
  { key: "impressions", header: "Impressões", align: "right", cell: (m) => inteiro(m.impressions) },
  { key: "clicks", header: "Cliques", align: "right", cell: (m) => inteiro(m.clicks) },
  { key: "conversions", header: "Conversas", align: "right", cell: (m) => inteiro(m.conversions) },
  { key: "roas", header: "Retorno (ROAS)", align: "right", cell: (m) => roasLabel(m.roas) },
];

const adColumns: ChannelColumn<RoiByCampaignRow>[] = [
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
  { key: "conversas", header: "Conversas iniciadas", align: "right", cell: (r) => inteiro(r.conversas) },
  { key: "qualificados", header: "Qualificadas pelo bot", align: "right", cell: (r) => inteiro(r.qualificados) },
  {
    key: "taxa",
    header: "Taxa",
    align: "right",
    cell: (r) =>
      r.conversas > 0 ? `${Math.round((r.qualificados / r.conversas) * 100)}%` : "—",
  },
];

/**
 * Campanhas: o resumo por canal, a lista campanha a campanha e, embaixo, as
 * conversas do WhatsApp que cada anuncio trouxe (com nome, quando a Meta ja
 * entregou o nome; o id cru so aparece enquanto isso).
 */
export default function HotelCampaignsPage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const clientId = client?.id ?? null;
  const [period, setPeriod] = useState<DateRange>(currentMonth);

  const { data, isLoading, isError } = useHotelPortalCampaigns(clientId, period);
  const { data: roi } = useHotelRoi(clientId, period);
  const { data: funil } = useHotelFunnelMetrics(clientId, period);

  const summary = data?.summary ?? [];
  const metrics = data?.metrics ?? [];

  // Nivel 2 do ROI tem nome do anuncio; o funil so tem o id. Prefere o nome.
  const adRows: RoiByCampaignRow[] =
    roi?.nivel2?.roiByCampaign?.length
      ? roi.nivel2.roiByCampaign
      : (funil?.conversasPorAnuncio ?? []).map((r) => ({
          campaignId: r.sourceId,
          conversas: r.count,
          qualificados: 0,
        }));

  return (
    <PainelPageShell
      title="Campanhas"
      description="Cada campanha no Meta Ads e Google Ads: quanto custou, quantos cliques trouxe e quantas conversas começaram no WhatsApp por causa dela."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar dados de campanhas."
      actions={<DateRangeFilter value={period} onChange={setPeriod} presets={MONTH_PRESETS} />}
    >
      {summary.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary.map((s) => (
            <ChannelSummaryCard key={s.channel} s={s} />
          ))}
        </div>
      )}

      <PainelSection title="Campanha a campanha" description="Somatório do período, da que mais investiu para a que menos.">
        {metrics.length === 0 ? (
          <PortalEmptyState
            icon={Megaphone}
            title="Nenhuma campanha no período"
            description="Os números chegam das plataformas de anúncio a cada 6 horas. Se há campanha rodando e nada aparece, veja as integrações em Configurações."
          />
        ) : (
          <ChannelTable columns={campaignColumns} rows={metrics} getRowKey={(m) => m.id} />
        )}
      </PainelSection>

      <PainelSection
        title="Conversas no WhatsApp por anúncio"
        description="Quem clicou num anúncio de clique para WhatsApp e falou com o bot, agrupado pelo anúncio que trouxe a pessoa."
      >
        {adRows.length === 0 ? (
          <PortalEmptyState
            title="Nenhuma conversa veio de anúncio no período"
            description="Quando alguém clicar em um anúncio de clique para WhatsApp e falar com o bot, a conversa aparece aqui."
          />
        ) : (
          <ChannelTable columns={adColumns} rows={adRows} getRowKey={(r) => r.campaignId} />
        )}
      </PainelSection>

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/trafego", label: "Tráfego pago", hint: "A soma dos canais e o investimento dia a dia" },
          { href: "/dashboard/hotel/funil", label: "Funil do bot", hint: "Em que etapa está cada conversa que o anúncio trouxe" },
          { href: "/dashboard/hotel/retorno", label: "Retorno (ROI)", hint: "Custo por conversa e por lead qualificado" },
        ]}
      />
    </PainelPageShell>
  );
}
