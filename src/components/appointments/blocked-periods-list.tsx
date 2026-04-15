"use client";

import { useState } from "react";
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
} from "@heroui/react";
import { Plus, Trash2, Calendar, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { formatDate } from "@/src/common/lib/utils";
import {
  useListBlockedPeriods,
  useCreateBlockedPeriod,
  useDeleteBlockedPeriod,
} from "@/src/common/hooks/appointments/use-blocked-periods";

export function BlockedPeriodsList() {
  const t = useTranslations("appointments");
  const { data, isLoading, refetch } = useListBlockedPeriods({ limit: 50 });
  const createMutation = useCreateBlockedPeriod();
  const deleteMutation = useDeleteBlockedPeriod();

  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ startDatetime: "", endDatetime: "", label: "" });

  // A API pode retornar data.data.data[] ou data.data[] dependendo do backend
  const raw = data?.data as any;
  const periods = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

  const handleCreate = async () => {
    if (!formData.startDatetime || !formData.endDatetime) {
      toast.error(t("fillAllFields"));
      return;
    }
    try {
      await createMutation.mutateAsync({
        startDatetime: new Date(formData.startDatetime).toISOString(),
        endDatetime: new Date(formData.endDatetime).toISOString(),
        label: formData.label || undefined,
      });
      toast.success(t("blockedPeriodCreated"));
      setShowModal(false);
      setFormData({ startDatetime: "", endDatetime: "", label: "" });
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
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t("errorDeleting"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          <h3 className="text-lg font-semibold">{t("blockedPeriods")}</h3>
        </div>
        <Button
          size="sm"
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={() => setShowModal(true)}
        >
          {t("addBlockedPeriod")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
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
          {periods.map((period: any) => (
            <Card key={period.id}>
              <CardBody className="flex flex-row items-center justify-between p-4">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{period.label || t("blockedPeriod")}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(period.startDatetime)} → {formatDate(period.endDatetime)}
                  </p>
                </div>
                <Button
                  isIconOnly
                  size="sm"
                  color="danger"
                  variant="light"
                  onPress={() => setDeleteConfirmId(period.id)}
                  isLoading={deleteMutation.isPending && deleteConfirmId === period.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <ModalContent>
          <ModalHeader>{t("addBlockedPeriod")}</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label={t("label")}
              placeholder={t("labelPlaceholder")}
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
            />
            <Input
              type="datetime-local"
              label={t("startDatetime")}
              value={formData.startDatetime}
              onChange={(e) => setFormData({ ...formData, startDatetime: e.target.value })}
            />
            <Input
              type="datetime-local"
              label={t("endDatetime")}
              value={formData.endDatetime}
              onChange={(e) => setFormData({ ...formData, endDatetime: e.target.value })}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowModal(false)}>{t("cancel")}</Button>
            <Button color="primary" onPress={handleCreate} isLoading={createMutation.isPending}>
              {t("create")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <ModalContent>
          <ModalHeader>{t("confirmDeleteTitle")}</ModalHeader>
          <ModalBody>
            <p className="text-sm text-muted-foreground">{t("confirmDelete")}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteConfirmId(null)}>{t("cancel")}</Button>
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
