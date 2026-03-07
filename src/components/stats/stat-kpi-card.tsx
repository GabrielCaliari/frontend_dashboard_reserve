"use client";

import { Card, CardContent } from "@/src/components/ui/card";
import { TrendBadge } from "./trend-badge";
import type { MetricValueResponse } from "@/src/common/@types/@stats";

interface StatKpiCardProps {
  metric: MetricValueResponse;
}

export function StatKpiCard({ metric }: StatKpiCardProps) {
  return (
    <Card className="bg-[#16162a] border-gray-800">
      <CardContent className="p-4">
        <p className="text-xs text-gray-400 truncate">{metric.label}</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-gray-100">
            {metric.value}
            {metric.unit && (
              <span className="ml-1 text-sm font-normal text-gray-400">
                {metric.unit}
              </span>
            )}
          </span>
          <TrendBadge trend={metric.trend} />
        </div>
      </CardContent>
    </Card>
  );
}
