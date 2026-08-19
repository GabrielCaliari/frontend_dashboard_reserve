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

  if (isMobile) {
    return (
      <div className="space-y-3">
        {days.map((day) => {
          const ocupadas = calendar.unidades
            .map((unidade) => ({ unidade, dia: unidade.dias.find((d) => d.data === day.data)! }))
            .filter(({ dia }) => dia.estado !== "LIVRE");
          return (
            <div key={day.data} className="rounded-2xl border border-border bg-default-50 p-4">
              <p className="mb-2 text-sm font-semibold">{day.data}</p>
              {ocupadas.length ? (
                <ul className="space-y-1 text-sm">
                  {ocupadas.map(({ unidade, dia }) => (
                    <li key={unidade.unit_id}>
                      <button
                        aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}`}
                        className="flex w-full items-center gap-2 text-left"
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
                <p className="text-sm text-muted-foreground">Tudo livre</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      {/* Desktop: grid unidade x dia com primeira coluna fixa */}
      <div className="overflow-x-auto rounded-3xl border border-border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-default-50 px-3 py-2 text-left font-medium">Unidade</th>
              {days.map((dia) => (
                <th key={dia.data} className="min-w-8 px-1 py-2 text-center font-normal text-muted-foreground">
                  {Number(dia.data.slice(8, 10))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calendar.unidades.map((unidade) => (
              <tr key={unidade.unit_id} className="border-t border-border">
                <td className="sticky left-0 z-10 whitespace-nowrap bg-default-50 px-3 py-1.5 font-medium">
                  {unidade.identificador}
                  <span className="ml-2 text-muted-foreground">{unidade.room_type_nome}</span>
                </td>
                {unidade.dias.map((dia) => (
                  <td key={dia.data} className="p-0.5">
                    <button
                      aria-label={`${unidade.identificador} ${dia.data}: ${ESTADO_STYLES[dia.estado].label}${dia.hospede_nome ? ` — ${dia.hospede_nome}` : ""}`}
                      className={`h-7 w-full rounded transition-colors ${ESTADO_STYLES[dia.estado].cell}`}
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
