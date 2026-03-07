"use client";

import { useState } from "react";
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
import { ProviderSelector } from "./provider-selector";
import { DynamicConfigForm } from "./dynamic-config-form";
import type {
  AvailableIntegration,
  CreateStatsIntegrationDto,
} from "@/src/common/@types/@stats";

interface AddIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: AvailableIntegration[];
  onSubmit: (data: CreateStatsIntegrationDto) => void;
  isSubmitting: boolean;
}

export function AddIntegrationModal({
  isOpen,
  onClose,
  providers,
  onSubmit,
  isSubmitting,
}: AddIntegrationModalProps) {
  const t = useTranslations("stats.integrations");
  const [selectedProvider, setSelectedProvider] =
    useState<AvailableIntegration | null>(null);
  const [label, setLabel] = useState("");
  const [config, setConfig] = useState<Record<string, unknown>>({});

  const handleClose = () => {
    setSelectedProvider(null);
    setLabel("");
    setConfig({});
    onClose();
  };

  const handleSubmit = () => {
    if (!selectedProvider) return;
    onSubmit({ key: selectedProvider.key, label, config });
    handleClose();
  };

  const isValid =
    selectedProvider &&
    label.trim().length > 0 &&
    Object.entries(selectedProvider.configSchema)
      .filter(([, f]) => f.required)
      .every(([key]) => config[key] !== undefined && config[key] !== "");

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()} size="2xl">
      <ModalContent>
        <ModalHeader className="text-gray-100">{t("addTitle")}</ModalHeader>
        <ModalBody className="pb-2 space-y-4">
          <ProviderSelector
            providers={providers}
            selectedKey={selectedProvider?.key ?? null}
            onSelect={setSelectedProvider}
          />

          {selectedProvider && (
            <>
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
                configSchema={selectedProvider.configSchema}
                onChange={setConfig}
              />
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            {t("cancel")}
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={!isValid}
          >
            {t("create")}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
