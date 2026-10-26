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
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "./chart-theme";
import type { ChartSeries } from "./line-chart";

export interface PortalBarChartProps {
  data: Record<string, string | number>[];
  xKey: string;
  series: ChartSeries[];
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function PortalBarChart({
  data,
  xKey,
  series,
  isLoading,
  height = 256,
  valueFormatter,
}: PortalBarChartProps) {
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
            width={valueFormatter ? 56 : 32}
            tickFormatter={valueFormatter}
          />
          <RechartsTooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            formatter={valueFormatter ? (v) => valueFormatter(Number(v)) : undefined}
          />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
