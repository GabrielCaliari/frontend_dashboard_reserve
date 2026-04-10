"use client";

import { useLocale } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
  Divider,
} from "@heroui/react";
import {
  Clock,
  User,
  Mail,
  Phone,
  Package,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import {
  useCancelAppointment,
  useCompleteAppointment,
} from "@/src/common/hooks/appointments/use-appointment-actions";
import type {
  Appointment,
  EAppointmentStatus,
} from "@/src/shared/domain/types/@appointment";

interface AppointmentDetailModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<
  EAppointmentStatus,
  "success" | "warning" | "default"
> = {
  confirmed: "success",
  cancelled: "default",
  completed: "warning",
};

const STATUS_ICONS: Record<EAppointmentStatus, any> = {
  confirmed: CheckCircle,
  cancelled: XCircle,
  completed: CheckCircle,
};

export function AppointmentDetailModal({
  appointment,
  isOpen,
  onClose,
  onRefresh,
}: AppointmentDetailModalProps) {
  const t = useTranslations("appointments");
  const locale = useLocale(); // Pegar o idioma atual
  const cancelMutation = useCancelAppointment();
  const completeMutation = useCompleteAppointment();

  if (!appointment) return null;

  const StatusIcon = STATUS_ICONS[appointment.status];

  // Corrigir formatação da data com locale correto
  const formatDate = (dateString: string) => {
    try {
      const localeMap: Record<string, string> = { en: "en-US", pt: "pt-BR" };

      const dateLocale = localeMap[locale] || "en-US";

      // Se já tem hora, usar direto
      if (dateString.includes("T")) {
        return new Date(dateString).toLocaleDateString(dateLocale, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      }
      // Se não tem hora, adicionar meio-dia para evitar problemas de timezone
      return new Date(dateString + "T12:00:00").toLocaleDateString(dateLocale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const dateLabel = formatDate(appointment.appointmentDate);

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(appointment.id);
      toast.success(t("cancelSuccess"));
      onRefresh();
      onClose();
    } catch {
      toast.error(t("errorCancel"));
    }
  };

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(appointment.id);
      toast.success(t("completeSuccess"));
      onRefresh();
      onClose();
    } catch {
      toast.error(t("errorComplete"));
    }
  };

  // Verificar se tem dados do Lead
  const hasLeadData =
    appointment.Lead &&
    (appointment.Lead.name ||
      appointment.Lead.email ||
      appointment.Lead.phone_number);

  // Verificar se email é válido (não é placeholder)
  const hasValidEmail =
    appointment.Lead?.email &&
    !appointment.Lead.email.includes("placeholder") &&
    !appointment.Lead.email.includes("noemail");

  // Verificar se telefone é válido (não é placeholder)
  const hasValidPhone =
    appointment.Lead?.phone_number &&
    appointment.Lead.phone_number.trim() !== "" &&
    !appointment.Lead.phone_number.includes("placeholder");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-background",
        header: "border-b border-divider",
        footer: "border-t border-divider",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-4 pr-8">
            <h3 className="text-xl font-bold">{t("appointmentDetails")}</h3>
            <Chip
              color={STATUS_COLORS[appointment.status]}
              variant="flat"
              startContent={<StatusIcon className="w-4 h-4" />}
            >
              {t(
                `status${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}` as any,
              )}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody className="py-6">
          <div className="space-y-6">
            {/* Data e Horário */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t("dateAndTime")}
              </h4>
              <div className="bg-default-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("date")}</p>
                    <p className="font-semibold capitalize">{dateLabel}</p>
                  </div>
                </div>
                <Divider />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t("time")}</p>
                    <p className="font-semibold text-lg">
                      {appointment.slotStartTime} – {appointment.slotEndTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações do Lead */}
            {hasLeadData ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("leadInfo")}
                </h4>
                <div className="bg-default-100 rounded-xl p-4 space-y-3">
                  {appointment.Lead?.name && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                          {t("name")}
                        </p>
                        <p className="font-semibold">{appointment.Lead.name}</p>
                      </div>
                    </div>
                  )}

                  {hasValidEmail && (
                    <>
                      <Divider />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t("email")}
                          </p>
                          <p className="font-medium text-sm break-all">
                            {appointment.Lead?.email}
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  {hasValidPhone && (
                    <>
                      <Divider />
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-warning" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            {t("phone")}
                          </p>
                          <p className="font-medium">
                            {appointment.Lead?.phone_number}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("leadInfo")}
                </h4>
                <div className="bg-warning/10 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <p className="font-semibold text-warning">
                        {t("leadDataUnavailable")}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Lead ID:{" "}
                        <span className="font-mono">{appointment.leadId}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Produto/Serviço */}
            {appointment.selectedProduct ? (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("productService")}
                </h4>
                <div className="bg-default-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {appointment.selectedProduct}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("productService")}
                </h4>
                <div className="bg-default-100 rounded-xl p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("notSpecified")}
                  </p>
                </div>
              </div>
            )}

            {/* Observações */}
            {appointment.notes && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {t("notes")}
                </h4>
                <div className="bg-default-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-foreground">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ID do Agendamento */}
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                ID: <span className="font-mono">{appointment.id}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("createdAt")}:{" "}
                {new Date(appointment.createdAt).toLocaleString(
                  locale === "pt" ? "pt-BR" : "en-US",
                )}
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("close")}
          </Button>
          {appointment.status === "confirmed" && (
            <>
              <Button
                color="success"
                variant="flat"
                onPress={handleComplete}
                isLoading={completeMutation.isPending}
                spinner={
                  <div className="w-4 h-4 border-2 border-success border-t-transparent rounded-full animate-spin" />
                }
              >
                {!completeMutation.isPending && (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                {t("actionComplete")}
              </Button>
              <Button
                color="danger"
                variant="flat"
                onPress={handleCancel}
                isLoading={cancelMutation.isPending}
                spinner={
                  <div className="w-4 h-4 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                }
              >
                {!cancelMutation.isPending && (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                {t("actionCancel")}
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
