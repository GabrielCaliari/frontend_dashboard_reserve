"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import type { StatsTimeseriesItem } from "@/src/common/@types/@stats";

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
    day: "2-digit",
    month: "2-digit",
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
    <Card className="bg-[#111125] border-gray-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg text-gray-100 break-words">{title}</CardTitle>
        {description ? (
          <CardDescription className="break-words text-gray-400">{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[280px] animate-pulse rounded-lg bg-[#16162a]" />
        ) : null}

        {!isLoading && error ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 px-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && chartData.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-gray-800 bg-[#16162a] px-6 text-center text-sm text-gray-400">
            {t("noTimeseriesData")}
          </div>
        ) : null}

        {!isLoading && !error && chartData.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <div className="h-[280px] min-w-[520px] sm:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
                  <CartesianGrid stroke="#2a2a40" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#7b7b93"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />
                  <YAxis
                    stroke="#7b7b93"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111125",
                      border: "1px solid #2a2a40",
                      borderRadius: "12px",
                      color: "#f5f5f7",
                    }}
                    labelStyle={{ color: "#f5f5f7" }}
                    formatter={(value: number) => [value.toLocaleString("pt-BR"), seriesItem?.metricLabel ?? title]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#5cc8ff"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, fill: "#5cc8ff" }}
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