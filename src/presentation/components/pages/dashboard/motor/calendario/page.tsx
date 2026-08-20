"use client";

import { useState } from "react";
import { Button, Spinner, Tab, Tabs } from "@heroui/react";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import { useMotorCalendarRange, useMotorGrade } from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { BulkUpdateForm } from "@/src/presentation/components/organisms/motor/bulk-update-form";
import { CellActionModal } from "@/src/presentation/components/organisms/motor/cell-action-modal";
import { ESTADO_STYLES, OccupancyGrid } from "@/src/presentation/components/organisms/motor/occupancy-grid";
import {
  AvailabilityLegend,
  TypeAvailabilityHeatmap,
} from "@/src/presentation/components/organisms/motor/type-availability-heatmap";
import { RateGrid } from "@/src/presentation/components/organisms/motor/rate-grid";
import { GradeCellModal } from "@/src/presentation/components/organisms/motor/grade-cell-modal";
import { PeriodBar, periodForMonth } from "@/src/presentation/components/organisms/motor/period-bar";
import type {
  MotorCalendarDia,
  MotorCalendarUnidade,
  MotorGradeDia,
  MotorGradeRoomType,
} from "@/src/shared/domain/types/@motor";

export default function MotorCalendarioPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const [period, setPeriod] = useState(() => periodForMonth(new Date()));

  const { data: calendar, isLoading: calLoading, isError: calError } = useMotorCalendarRange(
    tenantId,
    period.from,
    period.to,
  );
  const { data: grade, isLoading: gradeLoading, isError: gradeError } = useMotorGrade(
    tenantId,
    period.from,
    period.to,
  );

  const [selectedCell, setSelectedCell] = useState<{ unidade: MotorCalendarUnidade; dia: MotorCalendarDia } | null>(
    null,
  );
  const [ocupacaoView, setOcupacaoView] = useState<"tipo" | "unidade">("tipo");
  const [selectedGrade, setSelectedGrade] = useState<{ roomType: MotorGradeRoomType; dia: MotorGradeDia } | null>(
    null,
  );

  const canManageOcupacao = hasPermission("motor.blocks.manage") || hasPermission("motor.reservations.manage");
  const canManageGrade = hasPermission("motor.settings.manage");

  return (
    <PainelPageShell
      wide
      title="Calendário"
      description="Disponibilidade por tipo, ocupação por unidade, grade de tarifas e atualização em massa, tudo num só lugar."
      actions={<PeriodBar value={period} onChange={setPeriod} />}
    >
      <Tabs aria-label="Abas do calendário do motor de reservas">
        <Tab key="ocupacao" title="Ocupação">
          <div className="pt-4">
            {calLoading || (ocupacaoView === "tipo" && gradeLoading) ? (
              <div className="flex items-center justify-center py-16">
                <Spinner color="primary" size="lg" />
              </div>
            ) : calError ? (
              <p className="text-sm text-danger">Erro ao carregar o mapa de ocupação.</p>
            ) : calendar && calendar.unidades.length > 0 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={ocupacaoView === "tipo" ? "solid" : "flat"}
                      onPress={() => setOcupacaoView("tipo")}
                    >
                      Por tipo
                    </Button>
                    <Button
                      size="sm"
                      variant={ocupacaoView === "unidade" ? "solid" : "flat"}
                      onPress={() => setOcupacaoView("unidade")}
                    >
                      Por unidade
                    </Button>
                  </div>
                  {ocupacaoView === "tipo" ? (
                    <AvailabilityLegend />
                  ) : (
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      {Object.entries(ESTADO_STYLES).map(([estado, style]) => (
                        <span key={estado} className="flex items-center gap-1.5">
                          <span className={`h-3 w-3 rounded ${style.cell}`} /> {style.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {ocupacaoView === "tipo" ? (
                  <TypeAvailabilityHeatmap
                    grade={grade ?? { from: period.from, to: period.to, room_types: [] }}
                    unidades={calendar.unidades}
                  />
                ) : (
                  <OccupancyGrid
                    calendar={calendar}
                    onCellClick={(unidade, dia) => setSelectedCell({ unidade, dia })}
                  />
                )}
                {ocupacaoView === "unidade" ? (
                  <p className="text-xs text-foreground/50">
                    Clique numa célula livre para bloquear a unidade ou criar uma reserva manual.
                  </p>
                ) : null}
              </div>
            ) : (
              <PortalEmptyState
                title="Nenhuma unidade cadastrada"
                description="Cadastre acomodações e unidades para o mapa aparecer aqui."
              />
            )}
          </div>
        </Tab>
        <Tab key="grade" title="Grade de tarifas">
          <div className="pt-4">
            {gradeLoading ? (
              <div className="flex items-center justify-center py-16">
                <Spinner color="primary" size="lg" />
              </div>
            ) : gradeError ? (
              <p className="text-sm text-danger">Erro ao carregar a grade de tarifas.</p>
            ) : (
              <RateGrid
                canManage={canManageGrade}
                grade={grade ?? { from: period.from, to: period.to, room_types: [] }}
                onCellClick={(roomType, dia) => setSelectedGrade({ roomType, dia })}
              />
            )}
          </div>
        </Tab>
        <Tab key="massa" title="Atualização em massa">
          <div className="pt-4">
            {tenantId ? (
              <BulkUpdateForm canManage={hasPermission("motor.settings.manage")} tenantId={tenantId} />
            ) : (
              <PortalEmptyState
                title="Nenhum tenant selecionado"
                description="Selecione um tenant para atualizar tarifas em massa."
              />
            )}
          </div>
        </Tab>
      </Tabs>
      {selectedCell && tenantId ? (
        <CellActionModal
          canManage={canManageOcupacao}
          dia={selectedCell.dia}
          tenantId={tenantId}
          unidade={selectedCell.unidade}
          onClose={() => setSelectedCell(null)}
        />
      ) : null}
      {selectedGrade && tenantId ? (
        <GradeCellModal
          canManage={canManageGrade}
          dia={selectedGrade.dia}
          roomType={selectedGrade.roomType}
          tenantId={tenantId}
          onClose={() => setSelectedGrade(null)}
        />
      ) : null}
    </PainelPageShell>
  );
}
