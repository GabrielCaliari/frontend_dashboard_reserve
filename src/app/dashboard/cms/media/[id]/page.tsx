"use client";

import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useAsset, useUpdateAsset, useDeleteAsset } from "@/src/common/hooks/cms/use-assets";
import { formatFileSize } from "@/src/common/utils/format-file-size";
import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Button, 
  Input, 
  Textarea,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Breadcrumbs,
  BreadcrumbItem,
} from "@nextui-org/react";
import { 
  ArrowLeft, 
  Download, 
  Trash2, 
  Copy, 
  Check,
  FileText,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Asset Detail/Edit Page
 * 
 * Displays full asset details with editing capabilities.
 * Features:
 * - Large preview for images, icon for other file types
 * - Display metadata: URL (with copy button), filename, MIME type, file size, dimensions, upload date, creator
 * - Editable alt text field
 * - Metadata JSON editor with validation
 * - Download button
 * - Delete button with confirmation modal
 * - Success/error toasts for operations
 * - Breadcrumb navigation
 */
export default function AssetDetailPage() {
  const t = useTranslations("cms.media");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const assetId = parseInt(params.id as string);

  // State
  const [altText, setAltText] = useState("");
  const [metadataJson, setMetadataJson] = useState("");
  const [jsonError, setJsonError] = useState("");
  const [urlCopied, setUrlCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Modal state
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Fetch asset data
  const { data: asset, isLoading, error } = useAsset(assetId);

  // Mutations
  const updateMutation = useUpdateAsset();
  const deleteMutation = useDeleteAsset();

  // Initialize form fields when asset loads
  useMemo(() => {
    if (asset) {
      setAltText(asset.alt_text || "");
      setMetadataJson(asset.metadata ? JSON.stringify(asset.metadata, null, 2) : "{}");
      setHasChanges(false);
    }
  }, [asset]);

  // Handlers
  const handleAltTextChange = useCallback((value: string) => {
    setAltText(value);
    setHasChanges(true);
  }, []);

  const handleMetadataChange = useCallback((value: string) => {
    setMetadataJson(value);
    setHasChanges(true);
    
    // Validate JSON
    try {
      if (value.trim()) {
        JSON.parse(value);
      }
      setJsonError("");
    } catch (e) {
      setJsonError(t("invalidJson"));
    }
  }, [t]);

  const handleCopyUrl = useCallback(async () => {
    if (asset?.url) {
      try {
        await navigator.clipboard.writeText(asset.url);
        setUrlCopied(true);
        toast.success(t("urlCopied"));
        setTimeout(() => setUrlCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy URL:", err);
      }
    }
  }, [asset?.url, t]);

  const handleDownload = useCallback(() => {
    if (asset?.url) {
      window.open(asset.url, "_blank");
    }
  }, [asset?.url]);

  const handleSave = useCallback(async () => {
    if (!asset || jsonError) return;

    try {
      let parsedMetadata = undefined;
      if (metadataJson.trim()) {
        parsedMetadata = JSON.parse(metadataJson);
      }

      await updateMutation.mutateAsync({
        id: assetId,
        data: {
          alt_text: altText || undefined,
          metadata: parsedMetadata,
        },
      });

      toast.success(t("updateSuccess"));
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to update asset:", err);
      toast.error(t("updateError"));
    }
  }, [asset, assetId, altText, metadataJson, jsonError, updateMutation, t]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync(assetId);
      
      toast.success(t("deleteSuccess"));
      
      onClose();
      router.push("/dashboard/cms/media");
    } catch (err) {
      console.error("Failed to delete asset:", err);
      toast.error(t("deleteError"));
    }
  }, [assetId, deleteMutation, onClose, router, t]);

  const handleBack = useCallback(() => {
    router.push("/dashboard/cms/media");
  }, [router]);

  // Get file type icon
  const getFileIcon = useCallback((mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="h-16 w-16 text-blue-400" />;
    } else if (mimeType.startsWith("video/")) {
      return <Video className="h-16 w-16 text-purple-400" />;
    } else if (mimeType.includes("pdf") || mimeType.includes("document")) {
      return <FileText className="h-16 w-16 text-red-400" />;
    }
    return <File className="h-16 w-16 text-gray-400" />;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="cms">
        <div className="p-4">
          <div className="flex justify-center items-center h-64">
            <Spinner size="lg" label={tCommon("loading")} />
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  // Error or not found state
  if (error || !asset) {
    return (
      <LayoutScopeRoot routeActive="cms">
        <div className="p-4">
          <Breadcrumbs className="mb-6">
            <BreadcrumbItem onClick={handleBack} className="cursor-pointer">
              {t("assetsTitle")}
            </BreadcrumbItem>
            <BreadcrumbItem>{t("assetDetails")}</BreadcrumbItem>
          </Breadcrumbs>

          <Card className="bg-[#12121f] border border-gray-800">
            <CardBody className="text-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <p className="text-gray-400 text-lg mb-2">{t("assetNotFound")}</p>
              <p className="text-gray-500 text-sm mb-6">{t("assetNotFoundMessage")}</p>
              <Button
                onClick={handleBack}
                className="bg-blue-600 text-white hover:bg-blue-700"
                startContent={<ArrowLeft className="h-5 w-5" />}
              >
                {t("backToMedia")}
              </Button>
            </CardBody>
          </Card>
        </div>
      </LayoutScopeRoot>
    );
  }

  const isImage = asset.mime_type.startsWith("image/");

  return (
    <LayoutScopeRoot routeActive="cms">
      <div className="p-4">
        {/* Breadcrumbs */}
        <Breadcrumbs className="mb-6">
          <BreadcrumbItem onClick={handleBack} className="cursor-pointer">
            {t("assetsTitle")}
          </BreadcrumbItem>
          <BreadcrumbItem>{asset.filename}</BreadcrumbItem>
        </Breadcrumbs>

        {/* Back button */}
        <Button
          onClick={handleBack}
          variant="light"
          className="mb-4 text-gray-400 hover:text-gray-200"
          startContent={<ArrowLeft className="h-5 w-5" />}
        >
          {t("backToMedia")}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview Card */}
          <Card className="bg-[#12121f] border border-gray-800">
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-100">{tCommon("preview")}</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-center bg-[#1a1a2e] rounded-lg p-8 min-h-[400px]">
                {isImage ? (
                  <img
                    src={asset.url}
                    alt={asset.alt_text || asset.filename}
                    className="max-w-full max-h-[500px] object-contain rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {getFileIcon(asset.mime_type)}
                    <p className="text-gray-400 text-sm">{asset.filename}</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Details and Edit Card */}
          <Card className="bg-[#12121f] border border-gray-800">
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-100">{t("assetDetails")}</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* URL with copy button */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("assetUrl")}</label>
                <div className="flex gap-2">
                  <Input
                    value={asset.url}
                    readOnly
                    classNames={{
                      input: "bg-[#1a1a2e] text-gray-400 text-sm",
                      inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                    }}
                  />
                  <Button
                    onClick={handleCopyUrl}
                    className="bg-[#1a1a2e] border border-gray-700 hover:border-gray-600 min-w-[100px]"
                    startContent={urlCopied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  >
                    {urlCopied ? tCommon("success") : t("copyUrl")}
                  </Button>
                </div>
              </div>

              {/* Filename */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("filename")}</label>
                <Input
                  value={asset.filename}
                  readOnly
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                  }}
                />
              </div>

              {/* MIME Type */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("mimeType")}</label>
                <Input
                  value={asset.mime_type}
                  readOnly
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                  }}
                />
              </div>

              {/* File Size */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("fileSize")}</label>
                <Input
                  value={formatFileSize(asset.file_size)}
                  readOnly
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                  }}
                />
              </div>

              {/* Dimensions (if image) */}
              {asset.width && asset.height && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">{t("dimensions")}</label>
                  <Input
                    value={`${asset.width} × ${asset.height} px`}
                    readOnly
                    classNames={{
                      input: "bg-[#1a1a2e] text-gray-200",
                      inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                    }}
                  />
                </div>
              )}

              {/* Upload Date */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("uploadDate")}</label>
                <Input
                  value={new Date(asset.created_at).toLocaleString()}
                  readOnly
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                  }}
                />
              </div>

              {/* Creator */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("creator")}</label>
                <Input
                  value={`User ID: ${asset.created_by}`}
                  readOnly
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700",
                  }}
                />
              </div>

              {/* Editable Alt Text */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("altText")}</label>
                <Input
                  value={altText}
                  onChange={(e) => handleAltTextChange(e.target.value)}
                  placeholder={t("altTextPlaceholder")}
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                  }}
                />
              </div>

              {/* Editable Metadata JSON */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">{t("metadata")}</label>
                <Textarea
                  value={metadataJson}
                  onChange={(e) => handleMetadataChange(e.target.value)}
                  placeholder={t("metadataPlaceholder")}
                  minRows={6}
                  classNames={{
                    input: "bg-[#1a1a2e] text-gray-200 font-mono text-sm",
                    inputWrapper: "bg-[#1a1a2e] border border-gray-700 hover:border-gray-600",
                  }}
                />
                {jsonError && (
                  <p className="text-red-400 text-sm mt-1">{jsonError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  isDisabled={!hasChanges || !!jsonError}
                  isLoading={updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  {updateMutation.isPending ? t("updating") : t("saveChanges")}
                </Button>
                <Button
                  onClick={handleDownload}
                  className="bg-green-600 text-white hover:bg-green-700"
                  startContent={<Download className="h-5 w-5" />}
                >
                  {t("download")}
                </Button>
                <Button
                  onClick={onOpen}
                  className="bg-red-600 text-white hover:bg-red-700"
                  startContent={<Trash2 className="h-5 w-5" />}
                >
                  {tCommon("delete")}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal 
          isOpen={isOpen} 
          onClose={onClose}
          classNames={{
            base: "bg-[#12121f] border border-gray-800",
            header: "border-b border-gray-800",
            body: "py-6",
            footer: "border-t border-gray-800",
          }}
        >
          <ModalContent>
            <ModalHeader className="text-gray-100">
              {t("deleteConfirmTitle")}
            </ModalHeader>
            <ModalBody>
              <p className="text-gray-300">
                {t("deleteConfirmMessage")}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                <strong>{asset.filename}</strong>
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={onClose}
                className="text-gray-400 hover:text-gray-200"
              >
                {tCommon("cancel")}
              </Button>
              <Button
                color="danger"
                onPress={handleDelete}
                isLoading={deleteMutation.isPending}
                startContent={!deleteMutation.isPending && <Trash2 className="h-4 w-4" />}
              >
                {tCommon("delete")}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </LayoutScopeRoot>
  );
}
