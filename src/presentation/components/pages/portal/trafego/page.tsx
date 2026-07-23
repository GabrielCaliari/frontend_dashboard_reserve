"use client";

import { useState } from "react";
import { usePortalTraffic } from "@/src/modules/portal/presentation/hooks/use-portal-traffic";
import { TrafficMetrics } from "@/src/presentation/components/organisms/portal/traffic/traffic-metrics";
import { CampaignTable } from "@/src/presentation/components/organisms/portal/traffic/campaign-table";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import { PortalBarChart } from "@/src/presentation/components/organisms/portal/charts/bar-chart";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import { AttributionWindowBanner } from "@/src/presentation/components/organisms/portal/attribution-window-banner";
import { ExportPdfButton } from "@/src/presentation/components/organisms/portal/export-pdf-button";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export default function PortalTrafegoPage() {
  const [range] = useState(defaultRange);
  const { data, isLoading } = usePortalTraffic(range);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-portal-display text-2xl">Tráfego Pago</h1>
        <ExportPdfButton block="trafego" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <PortalChartSkeleton key={i} />
          ))}
        </div>
      ) : (
        <TrafficMetrics metrics={data!.headline_metrics} googleAds={data?.google_ads ?? null} />
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Investimento vs. conversas por dia</h2>
        <PortalLineChart
          data={data?.daily ?? []}
          xKey="date"
          isLoading={isLoading}
          series={[
            { key: "investimento", label: "Investimento", color: "#0ea5e9" },
            { key: "conversas_iniciadas", label: "Conversas iniciadas", color: "#22c55e" },
          ]}
        />
      </section>

      <section className="hidden md:block">
        {/* master doc §4.3: max 1 chart per mobile viewport — the biweekly comparison bar
            chart is desktop-only on this page; the daily line chart above is the mobile chart. */}
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Comparativo quinzenal</h2>
        <PortalBarChart
          data={data?.biweekly_comparison ?? []}
          xKey="period_label"
          isLoading={isLoading}
          series={[{ key: "investimento", label: "Investimento", color: "#0ea5e9" }]}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Desempenho por campanha</h2>
        {/* 30 is a placeholder default per master doc §4.2's attribution_settings.window_days
            default 30 — swap to the real per-tenant value once Task 14's BLOCKED endpoint lands. */}
        <AttributionWindowBanner windowDays={30} />
        <CampaignTable campaigns={data?.campaigns ?? []} />
      </section>
    </div>
  );
}
