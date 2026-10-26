"use client";

export interface DateRange {
  from: string;
  to: string;
}

export interface DatePreset {
  label: string;
  range: () => DateRange;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Ultimos N dias, contando hoje. */
export function lastDays(days: number): DateRange {
  const to = new Date();
  const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
  return { from: isoDay(from), to: isoDay(to) };
}

export function currentMonth(): DateRange {
  const now = new Date();
  return {
    from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: isoDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export function lastMonth(): DateRange {
  const now = new Date();
  return {
    from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)),
  };
}

/** Listas operacionais (funil, erros, feedbacks): o recente importa mais. */
export const LIST_PRESETS: DatePreset[] = [
  { label: "7 dias", range: () => lastDays(7) },
  { label: "30 dias", range: () => lastDays(30) },
  { label: "Mês atual", range: currentMonth },
];

/** Telas de marketing e retorno: o gerente compara mes fechado com mes corrente. */
export const MONTH_PRESETS: DatePreset[] = [
  { label: "30 dias", range: () => lastDays(30) },
  { label: "Mês atual", range: currentMonth },
  { label: "Mês passado", range: lastMonth },
];

const inputClass =
  "rounded-lg border border-border/70 bg-background px-2.5 py-1.5 text-[13px] text-foreground outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-primary";

/**
 * Filtro de periodo das telas do painel: atalhos e o par de datas para quem
 * quer "de tal dia ate tal dia". O mesmo em todas as telas, para a pessoa
 * aprender uma vez.
 */
export function DateRangeFilter({
  value,
  onChange,
  presets = LIST_PRESETS,
  children,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: DatePreset[];
  /** Filtros extras da tela, alinhados na mesma linha. */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <div className="flex items-center gap-1" role="group" aria-label="Períodos rápidos">
        {presets.map((p) => {
          const r = p.range();
          const ativo = r.from === value.from && r.to === value.to;
          return (
            <button
              key={p.label}
              aria-pressed={ativo}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                ativo ? "bg-foreground text-background" : "bg-default-100 text-foreground/70 hover:bg-default-200"
              }`}
              type="button"
              onClick={() => onChange(r)}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <label className="flex items-center gap-1.5">
          De
          <input
            type="date"
            className={inputClass}
            value={value.from}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
        </label>
        <label className="flex items-center gap-1.5">
          Até
          <input
            type="date"
            className={inputClass}
            value={value.to}
            min={value.from}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </label>
      </div>
      {children}
    </div>
  );
}

export const filterFieldClass = inputClass;
