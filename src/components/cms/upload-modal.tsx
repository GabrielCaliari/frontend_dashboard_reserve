"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
} from "@/src/components/ui/modal";
import { AssetUpload } from "./asset-upload";
import { useTranslations } from "next-intl";
import type { MediaCollection } from "@/src/common/@types/@cms-media";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  collection: MediaCollection;
  onUploadComplete?: () => void;
}

export function UploadModal({
  isOpen,
  onClose,
  collection,
  onUploadComplete,
}: UploadModalProps) {
  const t = useTranslations("cms.media");
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" isDismissable={false}>
      <ModalContent>
        <ModalHeader>
          {t("uploadModalTitle", { name: collection.name })}
        </ModalHeader>
        <ModalBody>
          <AssetUpload
            collection={collection}
            onUploadComplete={onUploadComplete}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
