"use client";

import { Card, CardBody } from "@heroui/react";
import type { Source } from "@/src/shared/domain/types/@hotel-portal-v1";
import { SourceBadge } from "./source-badge";
import { DeltaIndicator } from "./delta-indicator";
import type { DeltaKind } from "@/src/shared/utils/hotel-format";

/**
 * Card de número + variação + selo de origem (Doc 03 §3.2).
 * Número grande, label pequeno, selo 11px. Sem sombra (flat).
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaKind = "pct",
  invertDelta = false,
  source,
  icon: Icon,
  accent = false,
  hint,
}: {
  label: string;
  value: string;
  delta?: number | null;
  deltaKind?: DeltaKind;
  invertDelta?: boolean;
  source?: Source;
  icon?: React.ElementType;
  accent?: boolean;
  hint?: string;
}) {
  return (
    <Card
      className={`rounded-3xl shadow-none border ${
        accent
          ? "bg-primary/5 border-primary/20"
          : "bg-default-50 border-border"
      }`}
    >
      <CardBody className="p-5 sm:p-6 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          {Icon ? (
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                accent ? "bg-primary/10" : "bg-default-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  accent ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
          ) : (
            <span />
          )}
          {source && <SourceBadge source={source} />}
        </div>

        <div>
          <p className="text-2xl font-semibold text-foreground tracking-tight">
            {value}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{label}</p>
            <DeltaIndicator
              delta={delta}
              kind={deltaKind}
              invert={invertDelta}
            />
          </div>
          {hint && (
            <p className="text-xs text-muted-foreground/70 mt-1.5">{hint}</p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
