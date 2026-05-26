"use client";

import {
 CartesianGrid,
 Line,
 LineChart,
 ResponsiveContainer,
 Tooltip,
 XAxis,
 YAxis,
} from"recharts";
import { useTranslations } from"next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from"@/src/components/ui/card";
import type { StatsTimeseriesItem } from"@/src/common/@types/@stats";

interface StatsTimeseriesCardProps {
 title: string;
 description?: string;
 seriesItem?: StatsTimeseriesItem;
 isLoading?: boolean;
 error?: string;
}

function formatAxisDate(value: string) {
 const date = new Date(value);

 if (Number.isNaN(date.getTime())) {
 return value;
 }

 return date.toLocaleDateString("pt-BR", {
 day:"2-digit",
 month:"2-digit",
 });
}

export function StatsTimeseriesCard({
 title,
 description,
 seriesItem,
 isLoading,
 error,
}: StatsTimeseriesCardProps) {
 const t = useTranslations("stats");
 const chartData =
 seriesItem?.series.map((point) => ({
 ...point,
 label: formatAxisDate(point.date),
 })) ?? [];

  return (
    <Card className="bg-default-50 border-border shadow-none h-full flex flex-col">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground break-words">{title}</CardTitle>
        {description ? (
          <CardDescription className="break-words text-sm text-muted-foreground">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse rounded-xl bg-default-200" />
        ) : null}

        {!isLoading && error ? (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-danger/20 bg-danger/10 px-6 text-center text-sm font-medium text-danger">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-border bg-background px-6 text-center text-sm font-medium text-muted-foreground">
            {t("noTimeseriesData")}
          </div>
        ) : null}

        {!isLoading && !error && chartData.length > 0 ? (
          <div className="w-full h-full overflow-x-auto">
            <div className="h-[300px] min-w-[520px] sm:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    dy={10}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    dx={-10}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      color: "hsl(var(--foreground))",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                    }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
                    itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                    formatter={(value: number) => [value.toLocaleString("pt-BR"), seriesItem?.metricLabel ?? title]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={4}
                    dot={false}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}