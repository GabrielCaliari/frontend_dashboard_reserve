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
import { PortalChartSkeleton } from "@/src/presentation/components/organisms/hotel-portal/painel/skeletons";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { AXIS_TICK, CHART_COLORS, TOOLTIP_STYLE } from "./chart-theme";

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
  /** Formata o valor no tooltip e no eixo Y (ex.: dinheiro). */
  valueFormatter?: (value: number) => string;
}

export function PortalLineChart({
  data,
  xKey,
  series,
  isLoading,
  height = 256,
  valueFormatter,
}: PortalLineChartProps) {
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
            cursor={{ stroke: CHART_COLORS.grid }}
            formatter={valueFormatter ? (v) => valueFormatter(Number(v)) : undefined}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
