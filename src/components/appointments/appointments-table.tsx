"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Skeleton,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  MoreVertical,
  Calendar,
  Clock,
  User,
  Package,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/src/shared/lib/utils";
import {
  useCancelAppointment,
  useCompleteAppointment,
} from "@/src/common/hooks/appointments/use-appointment-actions";
import type {
  Appointment,
  EAppointmentStatus,
} from "@/src/shared/domain/types/@appointment";

interface AppointmentsTableProps {
  appointments: Appointment[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function AppointmentsTable({
  appointments,
  isLoading,
  onRefresh,
}: AppointmentsTableProps) {
  const t = useTranslations("appointments");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();

  const STATUS_COLORS: Record<
    EAppointmentStatus,
    "success" | "warning" | "default"
  > = {
    confirmed: "success",
    cancelled: "default",
    completed: "warning",
  };

  const STATUS_LABELS: Record<EAppointmentStatus, string> = {
    confirmed: t("statusConfirmed"),
    cancelled: t("statusCancelled"),
    completed: t("statusCompleted"),
  };

  const COLUMNS = [
    { key: "lead", label: t("columnLead") },
    { key: "date", label: t("columnDate") },
    { key: "time", label: t("columnTime") },
    { key: "product", label: t("columnProduct") },
    { key: "status", label: t("columnStatus") },
    { key: "created", label: t("columnCreated") },
    { key: "actions", label: "" },
  ];

  const handleCancel = async (id: string) => {
    if (!confirm(t("confirmCancel"))) return;
    try {
      await cancelMutation.mutateAsync(id);
      onRefresh();
    } catch (error: any) {
      alert(error.message || t("errorCancel"));
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm(t("confirmComplete"))) return;
    try {
      await completeMutation.mutateAsync(id);
      onRefresh();
    } catch (error: any) {
      alert(error.message || t("errorComplete"));
    }
  };

  const renderCell = (appointment: Appointment, key: string) => {
    switch (key) {
      case "lead":
        return (
          <div className="flex flex-col gap-1">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" />
              {appointment.Lead?.name || "—"}
            </p>
            <span className="text-xs text-muted-foreground">
              {appointment.Lead?.email || "—"}
            </span>
            {appointment.Lead?.phone_number && (
              <span className="text-xs text-muted-foreground">
                {appointment.Lead.phone_number}
              </span>
            )}
          </div>
        );
      case "date":
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            {formatDate(appointment.appointmentDate)}
          </div>
        );
      case "time":
        return (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            {appointment.slotStartTime} - {appointment.slotEndTime}
          </div>
        );
      case "product":
        return (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Package className="w-3.5 h-3.5" />
            {appointment.selectedProduct || "—"}
          </div>
        );
      case "status":
        return (
          <Chip
            color={STATUS_COLORS[appointment.status]}
            variant="flat"
            size="sm"
          >
            {STATUS_LABELS[appointment.status]}
          </Chip>
        );
      case "created":
        return (
          <span className="text-sm text-muted-foreground">
            {formatDate(appointment.createdAt)}
          </span>
        );
      case "actions":
        return appointment.status === "confirmed" ? (
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
                onPress={() => handleComplete(appointment.id)}
              >
                {t("actionComplete")}
              </DropdownItem>
              <DropdownItem
                key="cancel"
                className="text-danger"
                color="danger"
                startContent={<XCircle className="w-4 h-4" />}
                onPress={() => handleCancel(appointment.id)}
              >
                {t("actionCancel")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <Table
      aria-label="Appointments table"
      classNames={{
        wrapper: "rounded-xl border border-divider",
        th: "bg-default-100 text-xs font-semibold uppercase tracking-wider",
      }}
    >
      <TableHeader columns={COLUMNS}>
        {(col) => <TableColumn key={col.key}>{col.label}</TableColumn>}
      </TableHeader>
      <TableBody
        items={appointments}
        isLoading={isLoading}
        loadingContent={
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        }
        emptyContent={
          <div className="py-16 text-center text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">{t("noAppointments")}</p>
          </div>
        }
      >
        {(appointment) => (
          <TableRow key={appointment.id}>
            {(col) => (
              <TableCell>{renderCell(appointment, col as string)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
