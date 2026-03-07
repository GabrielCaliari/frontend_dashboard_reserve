"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/src/lib/utils";

interface TrendBadgeProps {
  trend?: number;
}

export function TrendBadge({ trend }: TrendBadgeProps) {
  if (trend === undefined || trend === null) return null;

  const isPositive = trend > 0;
  const isNegative = trend < 0;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isPositive && "bg-emerald-500/10 text-emerald-400",
        isNegative && "bg-red-500/10 text-red-400",
        !isPositive && !isNegative && "bg-gray-500/10 text-gray-400"
      )}
    >
      {isPositive && <TrendingUp className="h-3 w-3" />}
      {isNegative && <TrendingDown className="h-3 w-3" />}
      {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
      {isPositive && "+"}
      {trend.toFixed(1)}%
    </span>
  );
}
