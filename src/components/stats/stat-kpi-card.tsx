"use client";

import { Card, CardContent } from"@/src/components/ui/card";
import { TrendBadge } from"./trend-badge";
import type { MetricValueResponse } from"@/src/common/@types/@stats";
import { formatStatValue } from"./format-stat-value";

interface StatKpiCardProps {
 metric: MetricValueResponse;
}

export function StatKpiCard({ metric }: StatKpiCardProps) {
 const formattedValue = formatStatValue(metric.value, metric.unit);

 return (
 <Card className="bg-card border-border">
 <CardContent className="p-4">
 <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
 <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
 <span className="min-w-0 break-words text-xl font-bold text-foreground sm:text-2xl">
 {formattedValue}
 </span>
 <TrendBadge trend={metric.trend} />
 </div>
 </CardContent>
 </Card>
 );
}
