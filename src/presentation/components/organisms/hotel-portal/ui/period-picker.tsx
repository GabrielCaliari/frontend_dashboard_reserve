"use client";

import { useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Calendar, ChevronDown } from "lucide-react";
import type { Period } from "@/src/shared/domain/types/@hotel-portal-v1";

export type PeriodPreset = "current-month" | "last-month" | "last-90d";

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Resolve um preset para { from, to } (Doc 03 §5.4). */
export function resolvePreset(preset: PeriodPreset): Period {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  if (preset === "current-month") {
    return { from: iso(new Date(y, m, 1)), to: iso(new Date(y, m + 1, 0)) };
  }
  if (preset === "last-month") {
    return { from: iso(new Date(y, m - 1, 1)), to: iso(new Date(y, m, 0)) };
  }
  // last-90d
  const to = new Date(y, m, now.getDate());
  const from = new Date(to);
  from.setDate(from.getDate() - 89);
  return { from: iso(from), to: iso(to) };
}

const PRESET_LABELS: Record<PeriodPreset, string> = {
  "current-month": "Mês atual",
  "last-month": "Mês passado",
  "last-90d": "Últimos 90 dias",
};

/**
 * Seletor de período global (Doc 03 §5.4). Um só, no topo da página.
 * Muda from/to → re-fetch de toda a página.
 */
export function PeriodPicker({
  preset,
  onChange,
}: {
  preset: PeriodPreset;
  onChange: (preset: PeriodPreset, period: Period) => void;
}) {
  const label = useMemo(() => PRESET_LABELS[preset], [preset]);

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button
          variant="bordered"
          className="rounded-2xl border-border font-medium"
          startContent={<Calendar className="h-4 w-4 text-muted-foreground" />}
          endContent={<ChevronDown className="h-4 w-4 text-muted-foreground" />}
        >
          {label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Selecionar período"
        selectedKeys={[preset]}
        selectionMode="single"
        onAction={(key) => {
          const p = key as PeriodPreset;
          onChange(p, resolvePreset(p));
        }}
      >
        {(Object.keys(PRESET_LABELS) as PeriodPreset[]).map((p) => (
          <DropdownItem key={p}>{PRESET_LABELS[p]}</DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
