"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@nextui-org/react";
import { useTranslations } from "next-intl";
import { DynamicConfigForm } from "./dynamic-config-form";
import type {
  StatsIntegration,
  AvailableIntegration,
  UpdateStatsIntegrationDto,
} from "@/src/common/@types/@stats";

interface EditIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: StatsIntegration | null;
  provider: AvailableIntegration | null;
  onSubmit: (id: string, data: UpdateStatsIntegrationDto) => void;
  isSubmitting: boolean;
}

export function EditIntegrationModal({
  isOpen,
  onClose,
  integration,
  provider,
  onSubmit,
  isSubmitting,
}: EditIntegrationModalProps) {
  const t = useTranslations("stats.integrations");
  const [label, setLabel] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (integration) {
      setLabel(integration.label);
      setConfig({});
    }
  }, [integration]);

  const handleSubmit = () => {
    if (!integration) return;
    const data: UpdateStatsIntegrationDto = { label };
    if (Object.keys(config).length > 0) data.config = config;
    onSubmit(integration.id, data);
    onClose();
  };

  if (!integration || !provider) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="2xl">
      <ModalContent>
        <ModalHeader className="text-gray-100">{t("editTitle")}</ModalHeader>
        <ModalBody className="pb-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              {t("labelField")}
            </label>
            <Input
              value={label}
              onValueChange={setLabel}
              placeholder={t("labelPlaceholder")}
              variant="bordered"
              classNames={{
                input: "text-gray-200",
                inputWrapper: "border-gray-700 bg-[#0a0a1a]",
              }}
            />
          </div>

          <DynamicConfigForm
            configSchema={provider.configSchema}
            initialValues={integration.config}
            onChange={setConfig}
            isEdit
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            {t("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!label.trim()}
          >
            {t("save")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
