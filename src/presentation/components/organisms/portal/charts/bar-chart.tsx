"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";
import type { ChartSeries } from "./line-chart";

export interface PortalBarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
  isLoading?: boolean;
  height?: number;
}

export function PortalBarChart({ data, xKey, series, isLoading, height = 256 }: PortalBarChartProps) {
  if (isLoading) return <PortalChartSkeleton />;
  if (data.length === 0) {
    return (
      <PortalEmptyState
        title="Sem dados no período"
        description="Ainda não há números suficientes para desenhar este gráfico."
      />
    );
  }

  return (
    <div role="figure" aria-label={series.map((s) => s.label).join(", ")} style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <RechartsTooltip />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
