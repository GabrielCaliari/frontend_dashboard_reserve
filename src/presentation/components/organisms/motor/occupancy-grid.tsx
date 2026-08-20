"use client";

import { useMediaQuery } from "@/src/shared/hooks/use-media-query";
import type {
  MotorCalendarDia,
  MotorCalendarEstado,
  MotorCalendarUnidade,
} from "@/src/shared/domain/types/@motor";

// Mapa legivel em 5 segundos (spec §5): cor por estado + legenda na pagina.
export const ESTADO_STYLES: Record<MotorCalendarEstado, { cell: string; label: string }> = {
  LIVRE: { cell: "bg-default-100 hover:bg-default-200", label: "Livre" },
  HOLD: { cell: "bg-warning/40", label: "Pré-reserva" },
  CONFIRMADA: { cell: "bg-success/50", label: "Confirmada" },
  OTA: { cell: "bg-primary/40", label: "OTA" },
  BLOCK: { cell: "bg-default-400/60", label: "Bloqueio" },
  MENSALISTA: { cell: "bg-secondary/40", label: "Mensalista" },
};

export const WEEKDAY_ABBR = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// A data vem como YYYY-MM-DD; monta no fuso local pra nao escorregar um dia.
// Exportados: a grade de tarifas e o mapa por tipo usam a mesma marcacao de
// fim de semana e de "hoje" para as tres visoes lerem igual.
export function weekdayOf(data: string): number {
  const [year, month, day] = data.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getDay();
}

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

interface OccupancyGridProps {
  // Afrouxado (Task 9): o componente so usa `unidades`, entao aceita qualquer
  // shape que tenha esse campo (MotorCalendar ou MotorCalendarRange).
  calendar: { unidades: MotorCalendarUnidade[] };
  onCellClick: (unidade: MotorCalendarUnidade, dia: MotorCalendarDia) => void;
}

export function OccupancyGrid({ calendar, onCellClick }: OccupancyGridProps) {
  const days = calendar.unidades[0]?.dias ?? [];
  // Mesmo padrao do PortalDataTable: renderiza UMA variante por viewport,
  // em vez de esconder a outra por CSS.
  const isMobile = useMediaQuery("(max-width: 767px)");
  const hoje = todayISO();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {days.map((day) => {
          const ocupadas = calendar.unidades
            .map((unidade) => ({ unidade, dia: unidade.dias.find((d) => d.data === day.data)! }))
            .filter(({ dia }) => dia.estado !== "LIVRE");
          const isToday = day.data === hoje;
          return (
            <div
              key={day.data}
              className={`rounded-2xl border bg-default-50 p-4 ${
                isToday ? "border-primary/40 ring-1 ring-primary/40" : "border-border"
              }`}
            >
              <p className="mb-2 flex items-baseline gap-2 text-sm font-semibold">
                {day.data}
                <span className="text-xs font-normal text-foreground/60">
                  {WEEKDAY_ABBR[weekdayOf(day.data)]}
                  {isToday ? " · hoje" : ""}
                </span>
              </p>
              {ocupadas.length ? (
                <ul className="space-y-1 text-sm">
                  {ocupadas.map(({ unidade, dia }) => (
                    <li key={unidade.unit_id}>
                      <button
                        aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}`}
                        className="flex w-full items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        type="button"
                        onClick={() => onCellClick(unidade, dia)}
                      >
                        <span className={`h-3 w-3 rounded-full ${ESTADO_STYLES[dia.estado].cell}`} />
                        {unidade.identificador} — {ESTADO_STYLES[dia.estado].label}
                        {dia.hospede_nome ? ` (${dia.hospede_nome})` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-foreground/60">Tudo livre</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: grid unidade x dia com primeira coluna fixa. Fim de semana com
          fundo no cabecalho e o dia de hoje com anel, pra achar a data no olho. */}
      <div className="overflow-x-auto rounded-3xl border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border-r border-border bg-default-50 px-3 py-2 text-left font-medium">
                Unidade
              </th>
              {days.map((dia) => {
                const dow = weekdayOf(dia.data);
                const isWeekend = dow === 0 || dow === 6;
                const isToday = dia.data === hoje;
                return (
                  <th
                    key={dia.data}
                    className={`min-w-8 px-1 py-2 text-center font-normal ${
                      isWeekend ? "bg-default-100/60" : ""
                    } ${isToday ? "text-primary ring-1 ring-inset ring-primary/40" : "text-foreground/60"}`}
                    scope="col"
                  >
                    <span className={`block leading-tight ${isToday ? "font-semibold" : ""}`}>
                      {Number(dia.data.slice(8, 10))}
                    </span>
                    <span className="block text-[10px] leading-tight text-foreground/40">
                      {WEEKDAY_ABBR[dow]}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {calendar.unidades.map((unidade) => (
              <tr key={unidade.unit_id} className="border-t border-border">
                <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-3 py-1.5 font-medium">
                  {unidade.identificador}
                  <span className="ml-2 font-normal text-foreground/60">{unidade.room_type_nome}</span>
                </td>
                {unidade.dias.map((dia) => (
                  <td
                    key={dia.data}
                    className={`p-0.5 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/40" : ""}`}
                  >
                    <button
                      aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}${dia.hospede_nome ? ` — ${dia.hospede_nome}` : ""}`}
                      className={`h-8 w-full rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${ESTADO_STYLES[dia.estado].cell}`}
                      title={dia.hospede_nome ?? ESTADO_STYLES[dia.estado].label}
                      type="button"
                      onClick={() => onCellClick(unidade, dia)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
