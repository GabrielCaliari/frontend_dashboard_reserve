"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button, Input, Textarea, Chip, Spinner } from "@heroui/react";
import { useDisclosure } from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/src/components/ui/modal";
import {
  X,
  Copy,
  Check,
  Download,
  Trash2,
  FileText,
  Video,
  File,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useUpdateAsset, useDeleteAsset, useDeleteCollectionAsset } from "@/src/common/hooks/cms/use-assets";
import { formatFileSize } from "@/src/common/utils/format-file-size";
import { toast } from "sonner";
import type { CmsMediaId, MediaAsset } from "@/src/common/@types/@cms-media";

interface AssetDrawerProps {
  asset: MediaAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: CmsMediaId) => void;
  collectionId?: CmsMediaId;
}

function getFilePreviewIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="w-16 h-16 text-blue-400" />;
  if (mimeType.startsWith("video/")) return <Video className="w-16 h-16 text-violet-400" />;
  if (mimeType.includes("pdf") || mimeType.includes("document"))
    return <FileText className="w-16 h-16 text-red-400" />;
  return <File className="w-16 h-16 text-gray-400" />;
}

export function AssetDrawer({ asset, isOpen, onClose, onDeleted, collectionId }: AssetDrawerProps) {
  const t = useTranslations("cms.media");
  const tCommon = useTranslations("common");

  const [altText, setAltText] = useState("");
  const [metadataJson, setMetadataJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [associationsOpen, setAssociationsOpen] = useState(false);

  const { isOpen: deleteOpen, onOpen: openDelete, onClose: closeDelete } = useDisclosure();

  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();
  const deleteCollectionMutation = useDeleteCollectionAsset(collectionId ?? "");

  // Sync form state when asset changes
  useEffect(() => {
    if (asset) {
      setAltText(asset.alt_text || "");
      setMetadataJson(asset.metadata ? JSON.stringify(asset.metadata, null, 2) : "{}");
      setHasChanges(false);
      setJsonError("");
      setUrlCopied(false);
    }
  }, [asset?.id]);

  const handleAltTextChange = useCallback((value: string) => {
    setAltText(value);
    setHasChanges(true);
  }, []);

  const handleMetadataChange = useCallback(
    (value: string) => {
      setMetadataJson(value);
      setHasChanges(true);
      try {
        if (value.trim()) JSON.parse(value);
        setJsonError("");
      } catch {
        setJsonError(t("invalidJson"));
      }
    },
    [t]
  );

  const handleCopyUrl = useCallback(async () => {
    if (!asset?.url) return;
    try {
      await navigator.clipboard.writeText(asset.url);
      setUrlCopied(true);
      toast.success(t("urlCopied"));
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      toast.error(t("failedToCopyUrl"));
    }
  }, [asset?.url, t]);

  const handleSave = useCallback(async () => {
    if (!asset || jsonError) return;
    try {
      let parsedMetadata: Record<string, unknown> | undefined;
      if (metadataJson.trim()) parsedMetadata = JSON.parse(metadataJson);
      await updateMutation.mutateAsync({
        id: asset.id,
        data: { alt_text: altText || undefined, metadata: parsedMetadata },
      });
      toast.success(t("updateSuccess"));
      setHasChanges(false);
    } catch {
      toast.error(t("updateError"));
    }
  }, [asset, altText, metadataJson, jsonError, updateMutation, t]);

  const handleDelete = useCallback(async () => {
    if (!asset) return;
    try {
      if (collectionId) {
        await deleteCollectionMutation.mutateAsync(asset.id);
      } else {
        await deleteMutation.mutateAsync(asset.id);
      }
      toast.success(t("deleteSuccess"));
      closeDelete();
      onClose();
      onDeleted(asset.id);
    } catch {
      toast.error(t("deleteError"));
    }
  }, [asset, collectionId, deleteCollectionMutation, deleteMutation, closeDelete, onClose, onDeleted, t]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl z-50 bg-[#0e0e1a] border-l border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-100 truncate">
            {asset?.filename ?? t("assetDetails")}
          </h2>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={onClose}
            aria-label={tCommon("close")}
            className="text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Body - scrollable */}
        {!asset ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col lg:flex-row gap-0 h-full">
              {/* Preview panel */}
              <div className="lg:w-[55%] bg-[#1a1a2e] flex items-center justify-center p-8 min-h-[300px] lg:min-h-0">
                {asset.mime_type.startsWith("image/") ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.filename}
                    className="max-w-full max-h-[500px] object-contain rounded-lg"
                  />
                ) : asset.mime_type.startsWith("video/") ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  (<video
                    src={asset.url}
                    controls
                    className="max-w-full max-h-[400px] rounded-lg"
                  />)
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center">
                    {getFilePreviewIcon(asset.mime_type)}
                    <p className="text-sm text-gray-400">{asset.filename}</p>
                  </div>
                )}
              </div>

              {/* Info + edit panel */}
              <div className="lg:w-[45%] p-6 space-y-5 border-l border-gray-800">
                {/* Read-only metadata */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("mimeType")}</p>
                    <Chip size="sm" variant="flat" className="text-xs">
                      {asset.mime_type}
                    </Chip>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("fileSize")}</p>
                    <p className="text-sm text-gray-300">{formatFileSize(asset.file_size)}</p>
                  </div>
                  {asset.width && asset.height && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t("dimensions")}</p>
                      <p className="text-sm text-gray-300">{asset.width} × {asset.height} px</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("uploadDate")}</p>
                    <p className="text-sm text-gray-300">
                      {new Date(asset.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{tCommon("status")}</p>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={
                        asset.status === "active"
                          ? "success"
                          : asset.status === "failed"
                          ? "danger"
                          : "warning"
                      }
                      className="text-xs capitalize"
                    >
                      {asset.status}
                    </Chip>
                  </div>
                </div>

                {/* URL with copy */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">URL</p>
                  <div className="flex gap-2">
                    <Input
                      value={asset.url}
                      readOnly
                      size="sm"
                      classNames={{
                        input: "text-gray-400 text-xs",
                        inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                      }}
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={handleCopyUrl}
                      aria-label={t("copyUrl")}
                      className="flex-shrink-0"
                    >
                      {urlCopied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      as="a"
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("openInNewTab")}
                      className="flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Editable alt text */}
                <div>
                  <Input
                    label={t("altText")}
                    value={altText}
                    onValueChange={handleAltTextChange}
                    placeholder={t("altTextPlaceholder")}
                    size="sm"
                    classNames={{
                      input: "bg-[#1a1a2e] text-gray-200",
                      inputWrapper: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                    }}
                  />
                </div>

                {/* Editable metadata JSON */}
                <div>
                  <Textarea
                    label={t("metadata")}
                    value={metadataJson}
                    onValueChange={handleMetadataChange}
                    placeholder="{}"
                    minRows={4}
                    classNames={{
                      input: "bg-[#1a1a2e] text-gray-200 font-mono text-xs",
                      inputWrapper: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                    }}
                  />
                  {jsonError && (
                    <p className="text-red-400 text-xs mt-1">{jsonError}</p>
                  )}
                </div>

                {/* Save button */}
                <Button
                  color="primary"
                  size="sm"
                  className="w-full"
                  isDisabled={!hasChanges || !!jsonError}
                  isLoading={updateMutation.isPending}
                  onPress={handleSave}
                >
                  {updateMutation.isPending ? tCommon("saving") : t("saveChanges")}
                </Button>

                {/* Associations section */}
                <div className="border-t border-gray-800 pt-4">
                  <button
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-gray-100 transition-colors"
                    onClick={() => setAssociationsOpen((v) => !v)}
                  >
                    <span>{t("associations")}</span>
                    {associationsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {associationsOpen && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 text-center py-4">
                        Associations are managed from each entity editor via the relations endpoints.
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 border-t border-gray-800 pt-4">
                  <Button
                    variant="flat"
                    size="sm"
                    className="flex-1"
                    startContent={<Download className="w-4 h-4" />}
                    as="a"
                    href={asset.url}
                    download={asset.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("download")}
                  </Button>
                  <Button
                    color="danger"
                    variant="flat"
                    size="sm"
                    className="flex-1"
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={openDelete}
                  >
                    {tCommon("delete")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Delete confirmation modal */}
      <Modal isOpen={deleteOpen} onClose={closeDelete} variant="danger">
        <ModalContent>
          <ModalHeader>{t("deleteConfirmTitle")}</ModalHeader>
          <ModalBody>
            {asset && (
              <p className="text-gray-400 text-sm font-medium">{asset.filename}</p>
            )}
            <p className="text-gray-300">{t("deleteConfirmMessage")}</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={closeDelete}>
              {tCommon("cancel")}
            </Button>
            <Button
              color="danger"
              onPress={handleDelete}
              isLoading={deleteMutation.isPending || deleteCollectionMutation.isPending}
              startContent={!(deleteMutation.isPending || deleteCollectionMutation.isPending) && <Trash2 className="w-4 h-4" />}
            >
              {tCommon("delete")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
