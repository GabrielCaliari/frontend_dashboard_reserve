"use client";

import { Button, Chip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Clock, User, Package, MoreVertical, CheckCircle, XCircle, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { useCancelAppointment, useCompleteAppointment } from "@/src/common/hooks/appointments/use-appointment-actions";
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
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();

  const dayAppts = appointments.filter(
    (a) => a.appointmentDate.split("T")[0] === date
  );

  const dateLabel = date
    ? new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const handleCancel = async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
      toast.success(t("cancelSuccess"));
      onRefresh();
    } catch {
      toast.error(t("errorCancel"));
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await completeMutation.mutateAsync(id);
      toast.success(t("completeSuccess"));
      onRefresh();
    } catch {
      toast.error(t("errorComplete"));
    }
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
          {dayAppts
            .sort((a, b) => a.slotStartTime.localeCompare(b.slotStartTime))
            .map((appt) => (
              <div
                key={appt.id}
                className="rounded-xl border border-divider bg-default-50 p-3 space-y-2"
              >
                {/* Time + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    {appt.slotStartTime} – {appt.slotEndTime}
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip color={STATUS_COLORS[appt.status]} variant="flat" size="sm">
                      {t(`status${appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}` as any)}
                    </Chip>
                    {appt.status === "confirmed" && (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Actions">
                          <DropdownItem
                            key="complete"
                            startContent={<CheckCircle className="w-4 h-4" />}
                            onPress={() => handleComplete(appt.id)}
                          >
                            {t("actionComplete")}
                          </DropdownItem>
                          <DropdownItem
                            key="cancel"
                            className="text-danger"
                            color="danger"
                            startContent={<XCircle className="w-4 h-4" />}
                            onPress={() => handleCancel(appt.id)}
                          >
                            {t("actionCancel")}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>
                </div>

                {/* Lead info */}
                {appt.Lead && (
                  <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <User className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-foreground font-medium">{appt.Lead.name}</p>
                      <p className="text-xs">{appt.Lead.email}</p>
                      {appt.Lead.phone_number && (
                        <p className="text-xs">{appt.Lead.phone_number}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Product */}
                {appt.selectedProduct && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    {appt.selectedProduct}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
