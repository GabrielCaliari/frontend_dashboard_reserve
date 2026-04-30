"use client";

import { useState } from "react";
import { Chip } from "@heroui/react";
import { Clock, User, Package, Calendar, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppointmentDetailModal } from "./appointment-detail-modal";
import type { Appointment, EAppointmentStatus } from "@/src/common/@types/@appointment";

interface DayAppointmentsPanelProps {
  date: string | null;
  appointments: Appointment[];
  onRefresh: () => void;
}

const STATUS_COLORS: Record<EAppointmentStatus, "success" | "warning" | "default"> = {
  confirmed: "success",
  cancelled: "default",
  completed: "warning",
};

export function DayAppointmentsPanel({ date, appointments, onRefresh }: DayAppointmentsPanelProps) {
  const t = useTranslations("appointments");
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Debug: ver o que está chegando
  console.log('📋 Appointments recebidos:', appointments);
  console.log('📋 Primeiro appointment:', appointments[0]);

  const dayAppts = appointments
    .filter((a) => a.appointmentDate.split("T")[0] === date)
    .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime)); // Ordenar por horário

  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleOpenDetail = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
  };

  const handleCloseDetail = () => {
    setSelectedAppointment(null);
  };

  if (!date) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-muted-foreground gap-3">
        <Calendar className="w-10 h-10 opacity-30" />
        <p className="text-sm">{t("selectDayToView")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-b border-divider pb-3">
        <p className="text-sm font-semibold text-foreground capitalize">{dateLabel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {dayAppts.length === 0
            ? t("noAppointmentsDay")
            : t("appointmentsCount", { count: dayAppts.length })}
        </p>
      </div>

      {dayAppts.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
          <Clock className="w-8 h-8 opacity-30" />
          <p className="text-sm">{t("noAppointmentsDay")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayAppts.map((appt) => {
            const hasLeadName = appt.Lead?.name;
            const hasProduct = appt.selectedProduct;
            
            return (
              <button
                key={appt.id}
                onClick={() => handleOpenDetail(appt)}
                className="w-full rounded-xl border border-divider bg-default-50 hover:bg-default-100 p-3 space-y-2.5 transition-all cursor-pointer text-left group"
              >
                {/* Horário + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{appt.slotStartTime} – {appt.slotEndTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip color={STATUS_COLORS[appt.status]} variant="flat" size="sm">
                      {t(`status${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}` as any)}
                    </Chip>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Nome do Paciente */}
                {hasLeadName ? (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-success" />
                    <span className="font-medium text-foreground truncate">{appt.Lead.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-warning" />
                    <span className="text-warning text-xs">Dados do paciente não disponíveis</span>
                  </div>
                )}

                {/* Produto */}
                {hasProduct && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span className="truncate">{appt.selectedProduct}</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes */}
      <AppointmentDetailModal
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={handleCloseDetail}
        onRefresh={onRefresh}
      />
    </div>
  );
}
