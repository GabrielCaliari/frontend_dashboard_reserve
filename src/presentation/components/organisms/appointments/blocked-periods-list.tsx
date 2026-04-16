"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  Checkbox,
  Chip,
} from "@heroui/react";
import {
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Pencil,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useListBlockedPeriods,
  useCreateBlockedPeriod,
  useUpdateBlockedPeriod,
  useDeleteBlockedPeriod,
} from "@/src/common/hooks/appointments/use-blocked-periods";
import type { BlockedPeriod } from "@/src/shared/domain/types/@appointment";

// ─── LocalizedDateInput ──────────────────────────────────────────────────────

function LocalizedDateInput({
  value,
  onChange,
  label,
  isRequired,
}: {
  value: string; // YYYY-MM-DD
  onChange: (v: string) => void;
  label?: string;
  isRequired?: boolean;
}) {
  const locale = useLocale();
  const isPt = locale === "pt";
  const placeholder = isPt ? "DD/MM/AAAA" : "MM/DD/YYYY";

  const isoToDisplay = (iso: string) => {
    if (!iso || iso.length < 10) return "";
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return "";
    return isPt ? `${d}/${m}/${y}` : `${m}/${d}/${y}`;
  };

  const digitsToISO = (digits: string): string => {
    if (digits.length < 8) return "";
    if (isPt)
      return `${digits.slice(4, 8)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
    return `${digits.slice(4, 8)}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  };

  const [display, setDisplay] = useState(() => isoToDisplay(value));

  // Sync display when value changes externally (modal opens with pre-filled data)
  useEffect(() => {
    setDisplay(isoToDisplay(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2)
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setDisplay(formatted);
    onChange(digitsToISO(digits));
  };

  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={display}
      onChange={(e) => handleChange(e.target.value)}
      variant="bordered"
      isRequired={isRequired}
      maxLength={10}
      description={placeholder}
    />
  );
}

function formatDate(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(iso: string, locale: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

function isFullDay(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return (
    s.getHours() === 0 &&
    s.getMinutes() === 0 &&
    e.getHours() === 23 &&
    e.getMinutes() >= 59
  );
}

function isSameDay(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return (
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate()
  );
}

// ─── form state ─────────────────────────────────────────────────────────────

const emptyForm = {
  startDate: "",
  startTime: "00:00",
  endDate: "",
  endTime: "23:59",
  label: "",
};

function buildDatetimes(form: typeof emptyForm, blockFullDay: boolean) {
  const startTime = blockFullDay ? "00:00" : form.startTime;
  const endDate = blockFullDay ? form.startDate : form.endDate;
  const endTime = blockFullDay ? "23:59" : form.endTime;

  const start = new Date(`${form.startDate}T${startTime}:00`);
  const end = new Date(`${endDate}T${endTime}:59`);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error("Invalid date");
  }

  return {
    startDatetime: start.toISOString(),
    endDatetime: end.toISOString(),
  };
}

function periodToForm(period: BlockedPeriod) {
  const s = new Date(period.startDatetime);
  const e = new Date(period.endDatetime);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    startDate: `${s.getFullYear()}-${pad(s.getMonth() + 1)}-${pad(s.getDate())}`,
    startTime: `${pad(s.getHours())}:${pad(s.getMinutes())}`,
    endDate: `${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`,
    endTime: `${pad(e.getHours())}:${pad(e.getMinutes())}`,
    label: period.label || "",
  };
}

// ─── component ──────────────────────────────────────────────────────────────

export function BlockedPeriodsList() {
  const t = useTranslations("appointments");
  const locale = useLocale();
  const { data, isLoading, refetch } = useListBlockedPeriods({ limit: 50 });
  const createMutation = useCreateBlockedPeriod();
  const updateMutation = useUpdateBlockedPeriod();
  const deleteMutation = useDeleteBlockedPeriod();

  // modals
  const [formModal, setFormModal] = useState<{
    open: boolean;
    editing: BlockedPeriod | null;
  }>({
    open: false,
    editing: null,
  });
  const [viewPeriod, setViewPeriod] = useState<BlockedPeriod | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // form
  const [blockFullDay, setBlockFullDay] = useState(true);
  const [formData, setFormData] = useState(emptyForm);

  const raw = data?.data as any;
  const periods: BlockedPeriod[] = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
      ? raw
      : [];

  // ── open create ──
  const openCreate = () => {
    setFormData(emptyForm);
    setBlockFullDay(true);
    setFormModal({ open: true, editing: null });
  };

  // ── open edit ──
  const openEdit = (period: BlockedPeriod) => {
    const form = periodToForm(period);
    setFormData(form);
    setBlockFullDay(isFullDay(period.startDatetime, period.endDatetime));
    setFormModal({ open: true, editing: period });
  };

  const closeForm = () => {
    setFormModal({ open: false, editing: null });
    setFormData(emptyForm);
    setBlockFullDay(true);
  };

  // ── submit ──
  const handleSubmit = async () => {
    if (!formData.startDate) {
      toast.error(t("fillAllFields"));
      return;
    }
    if (!blockFullDay && !formData.endDate) {
      toast.error(t("fillAllFields"));
      return;
    }

    let payload;
    try {
      payload = {
        ...buildDatetimes(formData, blockFullDay),
        label: formData.label || undefined,
      };
    } catch {
      toast.error(t("fillAllFields"));
      return;
    }

    try {
      if (formModal.editing?.id) {
        await updateMutation.mutateAsync({
          id: formModal.editing.id,
          period: payload,
        });
        toast.success(t("blockedPeriodUpdated") || "Período atualizado!");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(t("blockedPeriodCreated"));
      }
      closeForm();
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("errorCreating"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success(t("blockedPeriodDeleted"));
      setDeleteConfirmId(null);
      setViewPeriod(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("errorDeleting"));
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold">{t("blockedPeriods")}</h3>
        </div>
        <Button
          size="sm"
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={openCreate}
        >
          {t("addBlockedPeriod")}
        </Button>
      </div>

      {/* list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : periods.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t("noBlockedPeriods")}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-2">
          {periods.map((period) => {
            const fullDay = isFullDay(period.startDatetime, period.endDatetime);
            const sameDay = isSameDay(period.startDatetime, period.endDatetime);

            return (
              <Card
                key={period.id}
                className="border border-divider hover:border-primary/40 transition-colors"
              >
                <CardBody className="p-0">
                  <div className="flex flex-row items-center gap-3 p-4">
                    {/* clickable area */}
                    <div
                      className="flex flex-row items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => setViewPeriod(period)}
                    >
                      {/* icon */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                        {fullDay ? (
                          <Calendar className="w-4 h-4 text-warning" />
                        ) : (
                          <Clock className="w-4 h-4 text-warning" />
                        )}
                      </div>

                      {/* info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-foreground truncate">
                            {period.label || t("blockedPeriod")}
                          </p>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={fullDay ? "warning" : "secondary"}
                            className="text-xs"
                          >
                            {fullDay ? t("fullDay") : t("specificTime")}
                          </Chip>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {sameDay
                            ? formatDate(period.startDatetime, locale)
                            : `${formatDate(period.startDatetime, locale)} → ${formatDate(period.endDatetime, locale)}`}
                          {!fullDay && (
                            <span className="ml-2 text-xs opacity-70">
                              {formatTime(period.startDatetime, locale)} –{" "}
                              {formatTime(period.endDatetime, locale)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* actions — fora da área clicável para evitar button>button */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => openEdit(period)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        variant="light"
                        onPress={() => setDeleteConfirmId(period.id!)}
                        isLoading={
                          deleteMutation.isPending &&
                          deleteConfirmId === period.id
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── View modal ── */}
      <Modal
        isOpen={!!viewPeriod}
        onClose={() => setViewPeriod(null)}
        size="md"
      >
        <ModalContent>
          {viewPeriod &&
            (() => {
              const fullDay = isFullDay(
                viewPeriod.startDatetime,
                viewPeriod.endDatetime,
              );
              const sameDay = isSameDay(
                viewPeriod.startDatetime,
                viewPeriod.endDatetime,
              );
              return (
                <>
                  <ModalHeader className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      {fullDay ? (
                        <Calendar className="w-4 h-4 text-warning" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <span>{viewPeriod.label || t("blockedPeriod")}</span>
                  </ModalHeader>
                  <ModalBody className="space-y-4 pb-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-default-100 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("type") || "Tipo"}
                        </p>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={fullDay ? "warning" : "secondary"}
                        >
                          {fullDay
                            ? t("fullDay") || "Dia inteiro"
                            : t("specificTime") || "Horário específico"}
                        </Chip>
                      </div>
                      <div className="bg-default-100 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("label") || "Motivo"}
                        </p>
                        <p className="text-sm font-medium">
                          {viewPeriod.label || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-default-100 rounded-lg p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {t("period") || "Período"}
                      </p>
                      {fullDay ? (
                        sameDay ? (
                          <p className="text-sm font-medium">
                            {formatDate(viewPeriod.startDatetime, locale)} —{" "}
                            {t("fullDayBlocked")}
                          </p>
                        ) : (
                          <p className="text-sm font-medium">
                            {formatDate(viewPeriod.startDatetime, locale)} →{" "}
                            {formatDate(viewPeriod.endDatetime, locale)}
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({t("fullDay")})
                            </span>
                          </p>
                        )
                      ) : (
                        <div className="flex items-center gap-3 text-sm font-medium">
                          <span>
                            {formatDate(viewPeriod.startDatetime, locale)}
                          </span>
                          <span className="text-primary font-bold">
                            {formatTime(viewPeriod.startDatetime, locale)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>
                            {formatDate(viewPeriod.endDatetime, locale)}
                          </span>
                          <span className="text-primary font-bold">
                            {formatTime(viewPeriod.endDatetime, locale)}
                          </span>
                        </div>
                      )}
                    </div>

                    {viewPeriod.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        {t("createdAt")}:{" "}
                        {formatDate(viewPeriod.createdAt, locale)}{" "}
                        {formatTime(viewPeriod.createdAt, locale)}
                      </p>
                    )}
                  </ModalBody>
                  <ModalFooter>
                    <Button variant="light" onPress={() => setViewPeriod(null)}>
                      {t("close") || "Fechar"}
                    </Button>
                    <Button
                      variant="flat"
                      startContent={<Pencil className="w-4 h-4" />}
                      onPress={() => {
                        setViewPeriod(null);
                        openEdit(viewPeriod);
                      }}
                    >
                      {t("edit") || "Editar"}
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      startContent={<Trash2 className="w-4 h-4" />}
                      onPress={() => {
                        setViewPeriod(null);
                        setDeleteConfirmId(viewPeriod.id!);
                      }}
                    >
                      {t("delete")}
                    </Button>
                  </ModalFooter>
                </>
              );
            })()}
        </ModalContent>
      </Modal>

      {/* ── Create / Edit modal ── */}
      <Modal isOpen={formModal.open} onClose={closeForm} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h3 className="text-xl font-bold">
              {formModal.editing
                ? t("editBlockedPeriod") || "Editar período bloqueado"
                : t("addBlockedPeriod")}
            </h3>
            <p className="text-sm text-muted-foreground font-normal">
              {t("blockFullDayHint")?.replace("💡", "") ||
                "Configure o período que deseja bloquear"}
            </p>
          </ModalHeader>
          <ModalBody className="space-y-4 py-6">
            <Input
              label={t("label")}
              placeholder={t("labelPlaceholder")}
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              variant="bordered"
            />

            <Checkbox
              isSelected={blockFullDay}
              onValueChange={(v) => setBlockFullDay(v)}
              classNames={{ label: "text-sm" }}
            >
              {t("blockFullDay") || "Bloquear dia inteiro"}
            </Checkbox>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {blockFullDay ? t("date") || "Data" : t("startDate")}
                </label>
                <LocalizedDateInput
                  value={formData.startDate}
                  onChange={(v) => setFormData({ ...formData, startDate: v })}
                  isRequired
                />
                {!blockFullDay && (
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    variant="bordered"
                    label={t("startTime") || "Hora início"}
                  />
                )}
              </div>

              {!blockFullDay && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t("endDate")}
                  </label>
                  <LocalizedDateInput
                    value={formData.endDate}
                    onChange={(v) => setFormData({ ...formData, endDate: v })}
                    isRequired
                  />
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    variant="bordered"
                    label={t("endTime") || "Hora fim"}
                  />
                </div>
              )}
            </div>

            {blockFullDay && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-primary">
                  💡{" "}
                  {t("blockFullDayHint") ||
                    "O dia selecionado será bloqueado por completo (00:00 até 23:59)."}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeForm}>
              {t("cancel")}
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isPending}
            >
              {formModal.editing ? t("save") || "Salvar" : t("create")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* ── Delete confirm ── */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
      >
        <ModalContent>
          <ModalHeader>{t("confirmDeleteTitle")}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">
              {t("confirmDelete")}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteConfirmId(null)}>
              {t("cancel")}
            </Button>
            <Button
              color="danger"
              onPress={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              isLoading={deleteMutation.isPending}
            >
              {t("delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
