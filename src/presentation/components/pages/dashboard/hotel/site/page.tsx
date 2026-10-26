"use client";

import { useMemo, useState } from "react";
import { Globe, LogOut, Package, Users } from "lucide-react";
import {
  useActiveHotelClient,
  useHotelPortalSite,
} from "@/src/shared/hooks/hotel-portal";
import type { SiteMetricsTotals } from "@/src/shared/domain/types/@hotel-portal";
import {
  PainelPageShell,
  PainelSection,
} from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalLineChart } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/line-chart";
import { CHART_COLORS } from "@/src/presentation/components/organisms/hotel-portal/painel/charts/chart-theme";
import {
  DateRangeFilter,
  MONTH_PRESETS,
  lastDays,
  type DateRange,
} from "@/src/presentation/components/organisms/hotel-portal/painel/date-range-filter";
import { ScreenLinks } from "@/src/presentation/components/organisms/hotel-portal/painel/screen-links";
import { ManageDataButton } from "@/src/presentation/components/organisms/hotel-portal/manage-data-button";
import { EmptyState, MetricCard } from "@/src/presentation/components/organisms/hotel-portal/ui";
import { formatDayMonth, formatNumber, formatPercent } from "@/src/shared/utils/hotel-format";

const EMPTY_TOTALS: SiteMetricsTotals = {
  organic_visitors: 0,
  paid_visitors: 0,
  direct_visitors: 0,
  social_visitors: 0,
  total_visitors: 0,
  package_page_views: 0,
  checkout_starts: 0,
  checkout_completes: 0,
  conversion_rate: 0,
  avg_bounce_rate: 0,
};

const ORIGENS: { key: keyof SiteMetricsTotals; label: string; tone: string; hint: string }[] = [
  { key: "organic_visitors", label: "Busca orgânica", tone: "bg-success", hint: "Google sem pagar" },
  { key: "paid_visitors", label: "Anúncios", tone: "bg-primary", hint: "Meta e Google Ads" },
  { key: "direct_visitors", label: "Direto", tone: "bg-foreground/60", hint: "Digitou o endereço ou salvou" },
  { key: "social_visitors", label: "Redes sociais", tone: "bg-warning", hint: "Instagram e Facebook" },
];

/**
 * Site: o que o GA4 mede de verdade (visitas, origem, paginas de pacote,
 * abandono). Inicio e fim de checkout vem do motor de reservas, nao do
 * tracking do site — por isso ficam num bloco a parte, honesto sobre a fonte.
 */
export default function HotelSitePage() {
  const { data: client, isLoading: clientLoading } = useActiveHotelClient();
  const [period, setPeriod] = useState<DateRange>(() => lastDays(30));
  const { data, isLoading, isError } = useHotelPortalSite(client?.id ?? null, period);

  const totals = data?.totals ?? EMPTY_TOTALS;
  const metrics = data?.metrics ?? [];

  const origens = ORIGENS.map((o) => ({ ...o, value: totals[o.key] })).filter((o) => o.value > 0);
  const totalOrigens = origens.reduce((s, o) => s + o.value, 0);

  const timeline = useMemo(
    () =>
      metrics.map((m) => ({
        date: formatDayMonth(m.metric_date),
        visitantes: m.organic_visitors + m.paid_visitors + m.direct_visitors + m.social_visitors,
      })),
    [metrics],
  );

  return (
    <PainelPageShell
      title="Site"
      description="Quem visita o site da pousada, de onde vem e o que faz lá dentro, medido pelo Google Analytics."
      isLoading={clientLoading || isLoading}
      isError={isError}
      errorMessage="Erro ao carregar dados do site."
      actions={
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <ManageDataButton clientId={client?.id} tab="site" />
          <DateRangeFilter value={period} onChange={setPeriod} presets={MONTH_PRESETS} />
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          label="Visitantes"
          value={formatNumber(totals.total_visitors)}
          icon={Users}
          source="auto"
          accent
        />
        <MetricCard
          label="Páginas de pacote vistas"
          value={formatNumber(totals.package_page_views)}
          icon={Package}
          source="auto"
          hint="Quando alguém abriu um pacote ou acomodação"
        />
        <MetricCard
          label="Taxa de abandono"
          value={formatPercent(totals.avg_bounce_rate * 100)}
          icon={LogOut}
          source="auto"
          hint="Saiu sem interagir com nada"
        />
        <MetricCard
          label="Vieram de anúncio"
          value={totalOrigens ? formatPercent((totals.paid_visitors / totalOrigens) * 100, 0) : "—"}
          icon={Globe}
          source="auto"
          hint="Parcela dos visitantes que chegou por Meta ou Google Ads"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <PainelSection title="De onde vêm os visitantes">
          <div className="rounded-2xl border border-border/80 bg-default-50 p-5">
            {totalOrigens === 0 ? (
              <EmptyState reason="sem-dados-periodo" compact />
            ) : (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-default-100" aria-hidden>
                  {origens.map((o) => (
                    <span
                      key={o.key}
                      className={o.tone}
                      style={{ width: `${(o.value / totalOrigens) * 100}%` }}
                    />
                  ))}
                </div>
                <ul className="mt-4 divide-y divide-border/60">
                  {origens.map((o) => (
                    <li key={o.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden className={`size-2 shrink-0 rounded-full ${o.tone}`} />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium text-foreground">{o.label}</span>
                          <span className="truncate text-xs text-muted-foreground">{o.hint}</span>
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums">
                        {formatNumber(o.value)}
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {Math.round((o.value / totalOrigens) * 100)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          </PainelSection>
        </div>

        <div className="lg:col-span-3">
          <PainelSection title="Visitantes por dia">
            <div className="rounded-2xl border border-border/80 bg-default-50 p-5">
              <PortalLineChart
                data={timeline}
                xKey="date"
                series={[{ key: "visitantes", label: "Visitantes", color: CHART_COLORS.primary }]}
                valueFormatter={formatNumber}
              />
            </div>
          </PainelSection>
        </div>
      </div>

      <PainelSection
        title="Do site à reserva"
        description="Início de checkout e reservas concluídas vêm do motor de reservas, não do tracking do site."
      >
        <EmptyState reason="via-motor-em-breve" />
      </PainelSection>

      <ScreenLinks
        links={[
          { href: "/dashboard/hotel/trafego", label: "Tráfego pago", hint: "O que foi investido para trazer essas visitas" },
          { href: "/dashboard/hotel/whatsapp-links", label: "Links rastreáveis", hint: "O botão de WhatsApp do site, com origem marcada" },
        ]}
      />
    </PainelPageShell>
  );
}
