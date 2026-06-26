"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/portal/skeletons";
import { PortalEmptyState } from "@/src/presentation/components/organisms/portal/empty-state";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface PortalLineChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
  isLoading?: boolean;
  height?: number;
}

export function PortalLineChart({ data, xKey, series, isLoading, height = 256 }: PortalLineChartProps) {
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
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} width={32} />
          <RechartsTooltip />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
