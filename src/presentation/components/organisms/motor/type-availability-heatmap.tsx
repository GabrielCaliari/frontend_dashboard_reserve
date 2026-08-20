"use client";

import { WEEKDAY_ABBR, todayISO, weekdayOf } from "@/src/presentation/components/organisms/motor/occupancy-grid";
import type { MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";

/**
 * Rampa de disponibilidade compartilhada entre o mapa por tipo e a linha
 * "Livres" da grade de tarifas: verde (tudo livre) -> ambar (ultimas
 * unidades) -> vermelho (esgotado). Vermelho SEMPRE significa zero a venda.
 */
export function availabilityTone(vendaveis: number, total: number): string {
  if (vendaveis <= 0) return "bg-danger/25 text-danger";
  const ratio = total > 0 ? vendaveis / total : 0;
  if (ratio <= 1 / 3) return "bg-warning/30 text-warning-600";
  if (ratio <= 2 / 3) return "bg-success/15 text-success-600";
  return "bg-success/35 text-success-700";
}

const LEGEND = [
  { swatch: "bg-success/35", label: "Tudo livre" },
  { swatch: "bg-success/15", label: "Boa oferta" },
  { swatch: "bg-warning/30", label: "Últimas unidades" },
  { swatch: "bg-danger/25", label: "Esgotado" },
];

export function AvailabilityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {LEGEND.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={`h-3 w-5 rounded ${item.swatch}`} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

interface TypeAvailabilityHeatmapProps {
  unidades: MotorCalendarUnidade[];
}

interface TipoRow {
  room_type_id: string;
  nome: string;
  total: number;
  livres: Map<string, number>;
}

/**
 * Visao padrao da Ocupacao: uma linha por TIPO de acomodacao com o numero de
 * unidades livres por dia, na rampa de cor. Cinco "Suite Casal" viram uma
 * linha so — a leitura que a visao por unidade nao da.
 */
export function TypeAvailabilityHeatmap({ unidades }: TypeAvailabilityHeatmapProps) {
  const days = unidades[0]?.dias ?? [];
  const hoje = todayISO();

  const rows: TipoRow[] = [];
  const porTipo = new Map<string, TipoRow>();
  for (const unidade of unidades) {
    let row = porTipo.get(unidade.room_type_id);
    if (!row) {
      row = { room_type_id: unidade.room_type_id, nome: unidade.room_type_nome, total: 0, livres: new Map() };
      porTipo.set(unidade.room_type_id, row);
      rows.push(row);
    }
    row.total += 1;
    for (const dia of unidade.dias) {
      if (dia.estado === "LIVRE") {
        row.livres.set(dia.data, (row.livres.get(dia.data) ?? 0) + 1);
      }
    }
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-r border-border bg-default-50 px-4 py-3 text-left text-xs font-medium">
              Acomodação
            </th>
            {days.map((dia) => {
              const dow = weekdayOf(dia.data);
              const isWeekend = dow === 0 || dow === 6;
              const isToday = dia.data === hoje;
              return (
                <th
                  key={dia.data}
                  className={`min-w-12 px-1 py-2 text-center font-normal ${
                    isWeekend ? "bg-default-100/60" : ""
                  } ${isToday ? "text-primary ring-1 ring-inset ring-primary/40" : "text-foreground/60"}`}
                  scope="col"
                >
                  <span className={`block text-sm leading-tight ${isToday ? "font-semibold" : ""}`}>
                    {Number(dia.data.slice(8, 10))}
                  </span>
                  <span className="block text-[10px] leading-tight text-foreground/40">{WEEKDAY_ABBR[dow]}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.room_type_id} className="border-t border-border">
              <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-4 py-2">
                <span className="block text-sm font-semibold">{row.nome}</span>
                <span className="block text-xs text-foreground/60">{row.total} un.</span>
              </td>
              {days.map((dia) => {
                const livres = row.livres.get(dia.data) ?? 0;
                return (
                  <td key={dia.data} className={`p-1 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/30" : ""}`}>
                    <div
                      aria-label={`${row.nome} ${dia.data}: ${livres} de ${row.total} livres`}
                      className={`flex h-10 min-w-11 items-center justify-center rounded-lg text-sm font-semibold ${availabilityTone(livres, row.total)}`}
                    >
                      {livres}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
