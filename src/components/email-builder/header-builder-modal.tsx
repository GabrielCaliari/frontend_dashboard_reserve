"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import HeaderBuilder, { type HeaderConfig } from "./header-builder";

interface HeaderBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: HeaderConfig;
  onSave: (config: HeaderConfig) => void;
}

export default function HeaderBuilderModal({
  isOpen,
  onClose,
  config,
  onSave,
}: HeaderBuilderModalProps) {
  const t = useTranslations();
  const [localConfig, setLocalConfig] = useState<HeaderConfig>({ ...config });

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("emailBuilder.headerBuilder")}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <HeaderBuilder config={localConfig} onChange={setLocalConfig} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
