"use client";

import { Tooltip } from "@heroui/react";
import { WEEKDAY_ABBR, todayISO, weekdayOf } from "@/src/presentation/components/organisms/motor/occupancy-grid";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import type {
  MotorCalendarEstado,
  MotorCalendarUnidade,
  MotorGrade,
} from "@/src/shared/domain/types/@motor";

/**
 * Rampa de disponibilidade compartilhada entre o mapa por tipo e a linha
 * "A venda" da grade de tarifas: verde (tudo livre) -> ambar (ultimas
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

const ESTADO_DOT: Record<MotorCalendarEstado, string> = {
  LIVRE: "bg-success/60",
  HOLD: "bg-warning",
  CONFIRMADA: "bg-success",
  OTA: "bg-secondary",
  BLOCK: "bg-default-400",
  MENSALISTA: "bg-default-400",
};

interface DiaBreakdown {
  livres: number;
  ocupadas: number;
  bloqueadas: number;
  total: number;
  unidades: { identificador: string; estado: MotorCalendarEstado }[];
}

/** ocupadas = hold/confirmada/OTA · bloqueadas = block/mensalista. */
function buildBreakdown(unidades: MotorCalendarUnidade[]): Map<string, Map<string, DiaBreakdown>> {
  const porTipo = new Map<string, Map<string, DiaBreakdown>>();
  for (const unidade of unidades) {
    let dias = porTipo.get(unidade.room_type_id);
    if (!dias) {
      dias = new Map();
      porTipo.set(unidade.room_type_id, dias);
    }
    for (const dia of unidade.dias) {
      let b = dias.get(dia.data);
      if (!b) {
        b = { livres: 0, ocupadas: 0, bloqueadas: 0, total: 0, unidades: [] };
        dias.set(dia.data, b);
      }
      b.total += 1;
      if (dia.estado === "LIVRE") b.livres += 1;
      else if (dia.estado === "BLOCK" || dia.estado === "MENSALISTA") b.bloqueadas += 1;
      else b.ocupadas += 1;
      b.unidades.push({ identificador: unidade.identificador, estado: dia.estado });
    }
  }
  return porTipo;
}

function CellTooltip({
  nome,
  data,
  stopSell,
  breakdown,
}: {
  nome: string;
  data: string;
  stopSell: boolean;
  breakdown: DiaBreakdown | undefined;
}) {
  if (!breakdown) return null;
  const ocupacaoPct = breakdown.total > 0
    ? Math.round(((breakdown.total - breakdown.livres) / breakdown.total) * 100)
    : 0;
  return (
    <div className="w-56 space-y-2 p-1">
      <p className="text-sm font-semibold">
        {nome}
        <span className="ml-2 font-normal text-foreground/60">{data.slice(8, 10)}/{data.slice(5, 7)}</span>
      </p>
      <div>
        <div className="mb-1 flex items-center justify-between text-xs text-foreground/60">
          <span>Ocupação</span>
          <span className="font-semibold text-foreground">{ocupacaoPct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-default-200">
          <div className="h-full rounded-full bg-primary" style={{ width: `${ocupacaoPct}%` }} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
        <dt className="text-foreground/60">Livres</dt>
        <dd className="text-right font-medium">{breakdown.livres}</dd>
        <dt className="text-foreground/60">Ocupadas</dt>
        <dd className="text-right font-medium">{breakdown.ocupadas}</dd>
        <dt className="text-foreground/60">Bloqueio/manutenção</dt>
        <dd className="text-right font-medium">{breakdown.bloqueadas}</dd>
        <dt className="text-foreground/60">Total</dt>
        <dd className="text-right font-medium">{breakdown.total}</dd>
      </dl>
      {stopSell ? (
        <p className="text-xs font-medium text-danger">Fechado para venda neste dia</p>
      ) : null}
      <ul className="space-y-0.5 border-t border-border pt-1.5 text-xs">
        {breakdown.unidades.slice(0, 8).map((u) => (
          <li key={u.identificador} className="flex items-center gap-1.5">
            <span aria-hidden className={`h-2 w-2 rounded-full ${ESTADO_DOT[u.estado]}`} />
            <span className="truncate">{u.identificador}</span>
          </li>
        ))}
        {breakdown.unidades.length > 8 ? (
          <li className="text-foreground/50">+{breakdown.unidades.length - 8} unidades</li>
        ) : null}
      </ul>
    </div>
  );
}

interface TypeAvailabilityHeatmapProps {
  /** Fonte dos numeros A VENDA — a MESMA da grade de tarifas (sincronia garantida). */
  grade: MotorGrade;
  /** Fonte do detalhe fisico (tooltip): estados por unidade vindos da ocupacao. */
  unidades: MotorCalendarUnidade[];
}

/**
 * Visao padrao da Ocupacao: uma linha por TIPO de acomodacao com o numero de
 * unidades A VENDA por dia, na mesma rampa e mesma fonte da grade de tarifas.
 * O detalhe fisico (livres/ocupadas/bloqueadas por unidade) vive no tooltip.
 */
export function TypeAvailabilityHeatmap({ grade, unidades }: TypeAvailabilityHeatmapProps) {
  const days = grade.room_types[0]?.dias ?? [];
  const hoje = todayISO();
  const breakdown = buildBreakdown(unidades);

  if (!grade.room_types.length || !days.length) {
    return (
      <PortalEmptyState
        title="Nenhuma acomodação cadastrada"
        description="Cadastre acomodações e unidades para o mapa aparecer aqui."
      />
    );
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
          {grade.room_types.map((rt) => {
            const diasDoTipo = breakdown.get(rt.room_type_id);
            return (
              <tr key={rt.room_type_id} className="border-t border-border">
                <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-4 py-2">
                  <span className="block text-sm font-semibold">{rt.nome}</span>
                  <span className="block text-xs text-foreground/60">{rt.total_units} un.</span>
                </td>
                {rt.dias.map((dia) => {
                  const vendaveis = dia.stop_sell ? 0 : dia.unidades_livres;
                  return (
                    <td key={dia.data} className={`p-1 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/30" : ""}`}>
                      <Tooltip
                        closeDelay={0}
                        content={
                          <CellTooltip
                            breakdown={diasDoTipo?.get(dia.data)}
                            data={dia.data}
                            nome={rt.nome}
                            stopSell={dia.stop_sell}
                          />
                        }
                        placement="top"
                      >
                        <div
                          aria-label={`${rt.nome} ${dia.data}: ${vendaveis} à venda de ${rt.total_units}`}
                          className={`flex h-10 min-w-11 items-center justify-center rounded-lg text-sm font-semibold ${availabilityTone(vendaveis, rt.total_units)}`}
                          tabIndex={0}
                        >
                          {vendaveis}
                        </div>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
