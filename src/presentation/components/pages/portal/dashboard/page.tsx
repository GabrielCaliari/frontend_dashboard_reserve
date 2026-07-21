"use client";

import { usePortalOverview } from "@/src/modules/portal/presentation/hooks/use-portal-overview";
import { useActivityFeed } from "@/src/modules/portal/presentation/hooks/use-activity-feed";
import { useMetricGoals } from "@/src/modules/portal/presentation/hooks/use-metric-goals";
import { PortalKpiCards } from "@/src/presentation/components/organisms/portal/overview/kpi-cards";
import { LastReportPreview } from "@/src/presentation/components/organisms/portal/overview/last-report-preview";
import { ActivityFeed } from "@/src/presentation/components/organisms/portal/activity/activity-feed";
import { GoalProgress } from "@/src/presentation/components/organisms/portal/goal-progress";
import { ExportPdfButton } from "@/src/presentation/components/organisms/portal/export-pdf-button";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

export default function PortalDashboardPage() {
  const { data, isLoading } = usePortalOverview();
  const { data: recentActivities } = useActivityFeed(5);
  const { data: goals } = useMetricGoals();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-portal-display text-2xl">Visão Geral</h1>
        <ExportPdfButton block="dashboard" label="Exportar relatório completo" />
      </div>

      <PortalKpiCards metrics={data?.headline_metrics ?? []} isLoading={isLoading} />
      {goals
        ?.filter((g) => g.show_goal)
        .map((goal) => {
          const metric = data?.headline_metrics.find((m) => m.metric_key === goal.metric_key);
          return metric ? <GoalProgress key={goal.metric_key} goal={goal} currentValue={metric.current_value} /> : null;
        })}

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
