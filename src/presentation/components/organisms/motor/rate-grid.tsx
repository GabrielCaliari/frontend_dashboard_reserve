"use client";

import { Fragment } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
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
  className,
  onClick,
}: {
  children: React.ReactNode;
  canManage: boolean;
  ariaLabel?: string;
  className: string;
  onClick: () => void;
}) {
  if (!canManage) {
    return <div className={className}>{children}</div>;
  }
  return (
    <button aria-label={ariaLabel} className={`${className} w-full`} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function RateGrid({ grade, canManage, onCellClick }: RateGridProps) {
  const days = grade.room_types[0]?.dias ?? [];

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
            <th className="sticky left-0 z-10 bg-default-50 px-3 py-2 text-left font-medium">Acomodação</th>
            {days.map((dia) => (
              <th key={dia.data} className="min-w-14 px-1 py-2 text-center font-normal text-muted-foreground">
                <span className="block capitalize">{format(parseISO(dia.data), "EEEEEE", { locale: ptBR })}</span>
                <span className="block">{Number(dia.data.slice(8, 10))}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grade.room_types.map((rt) => {
            const mostraMax = rt.capacidade_max > rt.capacidade_base;
            return (
              <Fragment key={rt.room_type_id}>
                <tr className="border-t-2 border-border bg-default-50">
                  <td className="sticky left-0 z-10 whitespace-nowrap px-3 py-2 font-semibold" colSpan={days.length + 1}>
                    {rt.nome}
                  </td>
                </tr>
                <tr key={`${rt.room_type_id}-livres`} className="border-t border-border">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-default-50 px-3 py-1.5 text-muted-foreground">
                    Livres
                  </td>
                  {rt.dias.map((dia) => {
                    const fechado = dia.unidades_livres === 0 || dia.stop_sell;
                    return (
                      <td key={dia.data} className="p-0.5">
                        <DayCell
                          ariaLabel={`${rt.nome} ${dia.data}: ${dia.unidades_livres} livres${dia.stop_sell ? ", fechado" : ""}`}
                          canManage={canManage}
                          className={`h-7 rounded text-center transition-colors ${fechado ? "bg-danger/20 text-danger" : "bg-default-100 hover:bg-default-200"}`}
                          onClick={() => onCellClick(rt, dia)}
                        >
                          {dia.unidades_livres}
                        </DayCell>
                      </td>
                    );
                  })}
                </tr>
                <tr key={`${rt.room_type_id}-base`} className="border-t border-border">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-default-50 px-3 py-1.5 font-medium">
                    {rt.capacidade_base} pessoas
                  </td>
                  {rt.dias.map((dia) => (
                    <td key={dia.data} className="p-0.5">
                      <DayCell
                        canManage={canManage}
                        className="h-7 rounded text-center transition-colors bg-default-50 hover:bg-default-100"
                        onClick={() => onCellClick(rt, dia)}
                      >
                        <span className={dia.stop_sell ? "line-through" : ""}>
                          {dia.preco !== null ? fmtBRL(dia.preco) : "—"}
                        </span>
                        {dia.min_stay && dia.min_stay > 1 ? (
                          <span className="ml-1 rounded bg-default-200 px-1 text-[10px]">{dia.min_stay}n</span>
                        ) : null}
                        {dia.override ? (
                          <span aria-hidden className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        ) : null}
                      </DayCell>
                    </td>
                  ))}
                </tr>
                {mostraMax ? (
                  <tr key={`${rt.room_type_id}-max`} className="border-t border-border">
                    <td className="sticky left-0 z-10 whitespace-nowrap bg-default-50 px-3 py-1.5 font-medium">
                      {rt.capacidade_max} pessoas
                    </td>
                    {rt.dias.map((dia) => (
                      <td key={dia.data} className="p-0.5">
                        <DayCell
                          canManage={canManage}
                          className="h-7 rounded text-center transition-colors bg-default-50 hover:bg-default-100"
                          onClick={() => onCellClick(rt, dia)}
                        >
                          <span className={dia.stop_sell ? "line-through" : ""}>
                            {dia.preco !== null ? fmtBRL(dia.preco + rt.valor_pessoa_adicional) : "—"}
                          </span>
                          {dia.min_stay && dia.min_stay > 1 ? (
                            <span className="ml-1 rounded bg-default-200 px-1 text-[10px]">{dia.min_stay}n</span>
                          ) : null}
                          {dia.override ? (
                            <span aria-hidden className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                          ) : null}
                        </DayCell>
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
