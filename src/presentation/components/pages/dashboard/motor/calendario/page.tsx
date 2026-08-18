"use client";

import { useState } from "react";
import { useTenantCapabilities } from "@/src/modules/settings/presentation/hooks/tenant-capabilities-provider";
import { useMotorCalendar } from "@/src/shared/hooks/motor";
import { PainelPageShell } from "@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell";
import { PortalEmptyState } from "@/src/presentation/components/organisms/hotel-portal/painel/empty-state";
import { CellActionModal } from "@/src/presentation/components/organisms/motor/cell-action-modal";
import { ESTADO_STYLES, OccupancyGrid } from "@/src/presentation/components/organisms/motor/occupancy-grid";
import { Input } from "@/src/presentation/components/atoms/shadcn-ui/input";
import type { MotorCalendarDia, MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function MotorCalendarioPage() {
  const { tenantId, hasPermission } = useTenantCapabilities();
  const [month, setMonth] = useState(currentMonth);
  const { data: calendar, isLoading, isError } = useMotorCalendar(tenantId, month);
  const [selected, setSelected] = useState<{ unidade: MotorCalendarUnidade; dia: MotorCalendarDia } | null>(null);
  const canManage = hasPermission("motor.blocks.manage") || hasPermission("motor.reservations.manage");

  return (
    <PainelPageShell
      title="Mapa de ocupação"
      description="Cada linha é uma unidade, cada célula é uma noite. Clique numa célula livre para bloquear ou criar reserva."
      isLoading={isLoading}
      isError={isError}
      errorMessage="Erro ao carregar o mapa de ocupação."
      actions={
        <Input
          aria-label="Mês do mapa"
          className="w-44"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      }
    >
      {calendar && calendar.unidades.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {Object.entries(ESTADO_STYLES).map(([estado, style]) => (
              <span key={estado} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${style.cell}`} /> {style.label}
              </span>
            ))}
          </div>
          <OccupancyGrid calendar={calendar} onCellClick={(unidade, dia) => setSelected({ unidade, dia })} />
        </div>
      ) : (
        <PortalEmptyState
          title="Nenhuma unidade cadastrada"
          description="Cadastre acomodações e unidades para o mapa aparecer aqui."
        />
      )}
      {selected && tenantId ? (
        <CellActionModal
          canManage={canManage}
          dia={selected.dia}
          tenantId={tenantId}
          unidade={selected.unidade}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </PainelPageShell>
  );
}
