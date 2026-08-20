"use client";

import { Fragment } from "react";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import {
  WEEKDAY_ABBR,
  todayISO,
  weekdayOf,
} from "@/src/presentation/components/organisms/motor/occupancy-grid";
import { availabilityTone } from "@/src/presentation/components/organisms/motor/type-availability-heatmap";
import type { MotorGrade, MotorGradeDia, MotorGradeRoomType } from "@/src/shared/domain/types/@motor";

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

interface RateGridProps {
  grade: MotorGrade;
  canManage: boolean;
  onCellClick: (rt: MotorGradeRoomType, dia: MotorGradeDia) => void;
}

function DayCell({
  children,
  canManage,
  ariaLabel,
  title,
  className,
  onClick,
}: {
  children: React.ReactNode;
  canManage: boolean;
  ariaLabel?: string;
  title?: string;
  className: string;
  onClick: () => void;
}) {
  if (!canManage) {
    return (
      <div className={className} title={title}>
        {children}
      </div>
    );
  }
  return (
    <button
      aria-label={ariaLabel}
      className={`${className} w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      title={title}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function PrecoCell({
  dia,
  valor,
  canManage,
  onClick,
}: {
  dia: MotorGradeDia;
  valor: number | null;
  canManage: boolean;
  onClick: () => void;
}) {
  return (
    <DayCell
      canManage={canManage}
      className="flex h-10 items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors hover:bg-default-100"
      onClick={onClick}
    >
      <span className={dia.stop_sell ? "text-foreground/40 line-through" : ""}>
        {valor !== null ? fmtBRL(valor) : "—"}
      </span>
      {dia.min_stay && dia.min_stay > 1 ? (
        <span className="rounded bg-default-200 px-1 text-[10px] font-normal text-foreground/60">
          {dia.min_stay}n
        </span>
      ) : null}
      {dia.override ? (
        <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-primary" title="Edição manual" />
      ) : null}
    </DayCell>
  );
}

export function RateGrid({ grade, canManage, onCellClick }: RateGridProps) {
  const days = grade.room_types[0]?.dias ?? [];
  const hoje = todayISO();

  if (!grade.room_types.length || !days.length) {
    return (
      <PortalEmptyState
        title="Nenhum tipo de acomodação com tarifa no período"
        description="Cadastre tipos de acomodação e regras de preço na tela Tarifas para a grade aparecer aqui."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 border-r border-border bg-default-50 px-4 py-3 text-left font-medium">
              Acomodação
            </th>
            {days.map((dia) => {
              const dow = weekdayOf(dia.data);
              const isWeekend = dow === 0 || dow === 6;
              const isToday = dia.data === hoje;
              return (
                <th
                  key={dia.data}
                  className={`min-w-[84px] px-1 py-2 text-center font-normal ${
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
            const mostraMax = rt.capacidade_max > rt.capacidade_base;
            return (
              <Fragment key={rt.room_type_id}>
                <tr className="border-t-2 border-border bg-default-100/80">
                  <td
                    className="sticky left-0 z-10 whitespace-nowrap px-4 py-2 text-sm font-semibold"
                    colSpan={days.length + 1}
                  >
                    {rt.nome}
                    <span className="ml-2 text-xs font-normal text-foreground/60">{rt.total_units} un.</span>
                  </td>
                </tr>
                <tr key={`${rt.room_type_id}-livres`} className="border-t border-border">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-4 py-1.5 text-foreground/60">
                    À venda
                  </td>
                  {rt.dias.map((dia) => {
                    // vermelho = zero A VENDA: stop de vendas zera o numero mesmo
                    // com unidades fisicamente livres (o motor nao vende).
                    const vendaveis = dia.stop_sell ? 0 : dia.unidades_livres;
                    return (
                      <td key={dia.data} className={`p-1 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/30" : ""}`}>
                        <DayCell
                          ariaLabel={`${rt.nome} ${dia.data}: ${vendaveis} à venda${dia.stop_sell ? ", fechado para venda" : ""}`}
                          canManage={canManage}
                          className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-colors ${availabilityTone(vendaveis, rt.total_units)}`}
                          title={
                            dia.stop_sell && dia.unidades_livres > 0
                              ? `Fechado para venda — ${dia.unidades_livres} unidade(s) fisicamente livre(s)`
                              : undefined
                          }
                          onClick={() => onCellClick(rt, dia)}
                        >
                          {vendaveis}
                        </DayCell>
                      </td>
                    );
                  })}
                </tr>
                <tr key={`${rt.room_type_id}-base`} className="border-t border-border">
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-4 py-1.5 font-medium">
                    {rt.capacidade_base} pessoas
                  </td>
                  {rt.dias.map((dia) => (
                    <td key={dia.data} className={`p-1 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/30" : ""}`}>
                      <PrecoCell canManage={canManage} dia={dia} valor={dia.preco} onClick={() => onCellClick(rt, dia)} />
                    </td>
                  ))}
                </tr>
                {mostraMax ? (
                  <tr key={`${rt.room_type_id}-max`} className="border-t border-border">
                    <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-default-50 px-4 py-1.5 font-medium">
                      {rt.capacidade_max} pessoas
                    </td>
                    {rt.dias.map((dia) => (
                      <td key={dia.data} className={`p-1 ${dia.data === hoje ? "ring-1 ring-inset ring-primary/30" : ""}`}>
                        <PrecoCell
                          canManage={canManage}
                          dia={dia}
                          valor={dia.preco !== null ? dia.preco + rt.valor_pessoa_adicional : null}
                          onClick={() => onCellClick(rt, dia)}
                        />
                      </td>
                    ))}
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
