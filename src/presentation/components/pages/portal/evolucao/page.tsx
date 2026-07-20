"use client";

import { usePortalTimeline } from "@/src/modules/portal/presentation/hooks/use-portal-timeline";
import { PortalLineChart } from "@/src/presentation/components/organisms/portal/charts/line-chart";
import { MilestoneList } from "@/src/presentation/components/organisms/portal/timeline/milestone-list";
import { FuturePlans } from "@/src/presentation/components/organisms/portal/timeline/future-plans";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";

/**
 * Note: the chart itself does not visually distinguish the `is_marco_zero`
 * point (Recharts' `Line` has no per-point styling in this wrapper) — the
 * marco-zero highlight master doc §3.6 asks for ("destacada em todos os
 * gráficos de longo prazo") is only carried by `<MilestoneList>` here.
 * Flagged as a follow-up: either extend `<PortalLineChart>` with an
 * optional `referenceLineX` prop (Recharts' `ReferenceLine`) or accept the
 * milestone list is sufficient — not resolved here to avoid guessing at a
 * shared-primitive change this late without confirming other charts want it.
 */
export default function PortalEvolucaoPage() {
  const { data, isLoading } = usePortalTimeline();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="font-portal-display text-2xl">Linha do Tempo</h1>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Conversas desde o início</h2>
        {isLoading ? (
          <PortalChartSkeleton />
        ) : (
          <PortalLineChart
            data={data?.baseline_series ?? []}
            xKey="date"
            series={[{ key: "conversas_iniciadas", label: "Conversas iniciadas", color: "#0ea5e9" }]}
          />
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Marcos</h2>
        <MilestoneList milestones={data?.milestones ?? []} />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">Planos futuros</h2>
        <FuturePlans plans={data?.future_plans ?? []} />
      </section>
    </div>
  );
}
