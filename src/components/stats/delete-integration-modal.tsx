"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StatsIntegration } from "@/src/common/@types/@stats";

interface DeleteIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: StatsIntegration | null;
  onConfirm: (id: string) => void;
  isDeleting: boolean;
}

export function DeleteIntegrationModal({
  isOpen,
  onClose,
  integration,
  onConfirm,
  isDeleting,
}: DeleteIntegrationModalProps) {
  const t = useTranslations("stats.integrations");

  if (!integration) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="md">
      <ModalContent>
        <ModalHeader className="text-gray-100">{t("deleteTitle")}</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-sm text-gray-300">
              {t("deleteConfirm", { name: integration.label })}
            </p>
            <p className="text-xs text-gray-500">{t("deleteWarning")}</p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("cancel")}
          </Button>
          <Button
            color="danger"
            onPress={() => {
              onConfirm(integration.id);
              onClose();
            }}
            isLoading={isDeleting}
          >
            {t("confirmDelete")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
