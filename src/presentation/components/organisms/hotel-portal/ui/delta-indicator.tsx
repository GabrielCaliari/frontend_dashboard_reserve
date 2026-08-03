"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import {
  formatDelta,
  deltaDirection,
  type DeltaKind,
} from "@/src/shared/utils/hotel-format";

/**
 * Seta ↑/↓ + variação formatada (Doc 03 §3.2).
 * `invert` para métricas onde cair é bom (ex: custo por reserva).
 */
export function DeltaIndicator({
  delta,
  kind = "pct",
  invert = false,
}: {
  delta: number | null | undefined;
  kind?: DeltaKind;
  invert?: boolean;
}) {
  if (delta == null) return null;

  const dir = deltaDirection(delta);
  if (dir === "neutral") {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const isGood = invert ? dir === "down" : dir === "up";
  const Icon = dir === "up" ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isGood ? "text-emerald-600" : "text-rose-600"
      }`}
    >
      <Icon className="h-3 w-3" />
      {formatDelta(Math.abs(delta), kind)}
    </span>
  );
}
