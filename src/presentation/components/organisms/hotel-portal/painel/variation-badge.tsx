import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/src/shared/lib/utils";

export interface VariationBadgeProps {
  /**
   * Variacao percentual vs. o periodo anterior (ex.: 12.5 ou -8).
   * `null` quando nao ha periodo anterior comparavel — nesse caso nada e
   * renderizado, em vez de fingir 0%.
   */
  value: number | null | undefined;
  /** True for cost-like metrics where a decrease is the good outcome (master doc §4.3 principle 3) */
  invertColor?: boolean;
}

export function VariationBadge({ value, invertColor = false }: VariationBadgeProps) {
  if (value == null || !Number.isFinite(value)) return null;

  const isPositive = value > 0;
  const isNegative = value < 0;
  const isGood = invertColor ? isNegative : isPositive;
  const isBad = invertColor ? isPositive : isNegative;

  const colorClass = isGood
    ? "text-emerald-600"
    : isBad
      ? "text-red-600"
      : "text-muted-foreground";

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  const formatted = `${value > 0 ? "+" : ""}${Math.round(value * 10) / 10}%`;

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium", colorClass)}>
      <Icon className="size-3.5" />
      {formatted}
    </span>
  );
}
