"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, addMonths, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export type PeriodWindow = "month" | "d14" | "d7" | "custom";
export interface PeriodValue { window: PeriodWindow; from: string; to: string }

const ISO = "yyyy-MM-dd";
const WINDOW_DAYS: Record<Exclude<PeriodWindow, "month" | "custom">, number> = { d14: 14, d7: 7 };

export function periodForMonth(anchor: Date): PeriodValue {
  return { window: "month", from: format(startOfMonth(anchor), ISO), to: format(endOfMonth(anchor), ISO) };
}

function shift(value: PeriodValue, direction: 1 | -1): PeriodValue {
  const from = parseISO(value.from);
  if (value.window === "month") return periodForMonth(addMonths(from, direction));
  const days = value.window === "custom"
    ? Math.max(1, Math.round((parseISO(value.to).getTime() - from.getTime()) / 86400000) + 1)
    : WINDOW_DAYS[value.window];
  const novoFrom = addDays(from, direction * days);
  return { ...value, from: format(novoFrom, ISO), to: format(addDays(novoFrom, days - 1), ISO) };
}

function applyWindow(value: PeriodValue, window: PeriodWindow): PeriodValue {
  const from = parseISO(value.from);
  if (window === "month") return periodForMonth(from);
  if (window === "custom") return { ...value, window };
  return { window, from: value.from, to: format(addDays(from, WINDOW_DAYS[window] - 1), ISO) };
}

function label(value: PeriodValue): string {
  const from = parseISO(value.from);
  if (value.window === "month") return format(from, "MMMM 'de' yyyy", { locale: ptBR });
  return `${format(from, "dd MMM", { locale: ptBR })} – ${format(parseISO(value.to), "dd MMM yyyy", { locale: ptBR })}`;
}

const WINDOWS: { key: PeriodWindow; label: string }[] = [
  { key: "month", label: "Mês" },
  { key: "d14", label: "14 dias" },
  { key: "d7", label: "7 dias" },
  { key: "custom", label: "Personalizado" },
];

export function PeriodBar({ value, onChange }: { value: PeriodValue; onChange: (v: PeriodValue) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const anchorYear = parseISO(value.from).getFullYear();
  const [pickerYear, setPickerYear] = useState(anchorYear);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-default-50 p-1">
        <Button isIconOnly size="sm" variant="light" aria-label="Periodo anterior"
          onPress={() => onChange(shift(value, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="relative">
          <button type="button" className="min-w-40 px-2 text-sm font-semibold capitalize"
            onClick={() => { setPickerYear(anchorYear); setPickerOpen((o) => !o); }}>
            {label(value)}
          </button>
          {pickerOpen && (
            <div className="absolute left-0 top-9 z-50 w-64 rounded-2xl border border-border bg-background p-3 shadow-none">
              <div className="mb-2 flex items-center justify-between">
                <Button isIconOnly size="sm" variant="light" aria-label="Ano anterior"
                  onPress={() => setPickerYear((y) => y - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="text-sm font-semibold">{pickerYear}</span>
                <Button isIconOnly size="sm" variant="light" aria-label="Proximo ano"
                  onPress={() => setPickerYear((y) => y + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 12 }, (_, m) => (
                  <button key={m} type="button"
                    className="rounded-xl px-2 py-1.5 text-xs capitalize hover:bg-default-100"
                    onClick={() => { onChange(periodForMonth(new Date(pickerYear, m, 1))); setPickerOpen(false); }}>
                    {format(new Date(pickerYear, m, 1), "MMM", { locale: ptBR })}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button isIconOnly size="sm" variant="light" aria-label="Proximo periodo"
          onPress={() => onChange(shift(value, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Button size="sm" variant="flat" onPress={() => onChange(periodForMonth(new Date()))}>Hoje</Button>
      <div className="flex items-center gap-1">
        {WINDOWS.map((w) => (
          <Button key={w.key} size="sm" variant={value.window === w.key ? "solid" : "flat"}
            onPress={() => onChange(applyWindow(value, w.key))}>
            {w.label}
          </Button>
        ))}
      </div>
      {value.window === "custom" && (
        <div className="flex items-center gap-2">
          <input type="date" aria-label="Data inicial" value={value.from}
            className="rounded-xl border border-border bg-default-50 px-2 py-1 text-sm"
            onChange={(e) => onChange({ ...value, from: e.target.value })} />
          <span className="text-sm text-foreground/60">até</span>
          <input type="date" aria-label="Data final" value={value.to}
            className="rounded-xl border border-border bg-default-50 px-2 py-1 text-sm"
            onChange={(e) => onChange({ ...value, to: e.target.value })} />
        </div>
      )}
    </div>
  );
}
