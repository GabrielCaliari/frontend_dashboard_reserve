"use client";

import { Zap, ShieldCheck, Pencil } from "lucide-react";
import type { Source } from "@/src/shared/domain/types/@hotel-portal-v1";

const CONFIG: Record<
  Source,
  { label: string; icon: React.ElementType; className: string }
> = {
  auto: {
    label: "automático",
    icon: Zap,
    className: "text-sky-600 bg-sky-500/10 border-sky-500/20",
  },
  server: {
    label: "rastreado",
    icon: ShieldCheck,
    className: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20",
  },
  manual: {
    label: "manual",
    icon: Pencil,
    className: "text-amber-600 bg-amber-500/10 border-amber-500/20",
  },
};

/**
 * Selo de origem do dado (Doc 03 §5.1). Sempre visível, pequeno.
 * É o que sustenta a confiança e mata as "métricas-fantasma".
 */
export function SourceBadge({
  source,
  showLabel = true,
}: {
  source: Source;
  showLabel?: boolean;
}) {
  const cfg = CONFIG[source];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] font-medium leading-none ${cfg.className}`}
      title={`Origem: ${cfg.label}`}
    >
      <Icon className="h-3 w-3" />
      {showLabel && <span>{cfg.label}</span>}
    </span>
  );
}
