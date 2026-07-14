"use client";

import { usePortalOverview } from "@/src/modules/portal/presentation/hooks/use-portal-overview";
import { useActivityFeed } from "@/src/modules/portal/presentation/hooks/use-activity-feed";
import { PortalKpiCards } from "@/src/presentation/components/organisms/portal/overview/kpi-cards";
import { LastReportPreview } from "@/src/presentation/components/organisms/portal/overview/last-report-preview";
import { ActivityFeed } from "@/src/presentation/components/organisms/portal/activity/activity-feed";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalDashboardPage() {
  const { data, isLoading } = usePortalOverview();
  const { data: recentActivities } = useActivityFeed(5);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Visão Geral</h1>

      <PortalKpiCards metrics={data?.headline_metrics ?? []} isLoading={isLoading} />

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas por dia (últimos 30 dias)</h2>
        {isLoading ? (
          <PortalChartSkeleton />
        ) : (
          <PortalLineChart
            data={data?.daily_conversas ?? []}
            xKey="date"
            series={[{ key: "conversas_iniciadas", label: "Conversas iniciadas", color: "#0ea5e9" }]}
          />
        )}
      </section>

      {!isLoading && <LastReportPreview report={data?.last_report_preview ?? null} />}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Atividades recentes</h2>
        <ActivityFeed entries={recentActivities ?? []} />
      </section>
    </div>
  );
}
