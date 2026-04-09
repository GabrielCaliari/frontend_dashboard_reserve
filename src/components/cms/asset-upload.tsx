"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { Button, Input, Progress, Chip, Alert } from "@heroui/react";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { useUploadAsset } from "@/src/common/hooks/cms/use-assets";
import type {
  MediaCollection,
  UploadQueueItem,
} from "@/src/common/@types/@cms-media";
import { toast } from "sonner";

interface AssetUploadProps {
  collection: MediaCollection;
  onUploadComplete?: () => void;
}

/**
 * Asset Upload Component
 *
 * Drag-and-drop file upload component with validation and progress tracking.
 * Features:
 * - Drag-and-drop zone with click-to-select
 * - Multiple file selection
 * - File type validation against collection's allowed_mime_types
 * - File size validation against collection's max_file_size
 * - Alt text input for image files
 * - Upload progress tracking per file
 * - File preview thumbnails for images
 * - Retry button for failed uploads
 * - Auto-clear successful uploads after 3 seconds
 */
export function AssetUpload({
  collection,
  onUploadComplete,
}: AssetUploadProps) {
  const t = useTranslations("cms.media.upload");
  const tCommon = useTranslations("common");

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [altTexts, setAltTexts] = useState<Record<string, string>>({});
  const { mutateAsync: uploadAsset, uploadProgress } = useUploadAsset();
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);

  // Validate file type
  const isValidFileType = useCallback(
    (file: File): boolean => {
      return collection.allowed_mime_types.includes(file.type);
    },
    [collection.allowed_mime_types],
  );

  // Validate file size
  const isValidFileSize = useCallback(
    (file: File): boolean => {
      return file.size <= collection.max_file_size;
    },
    [collection.max_file_size],
  );

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + "" + sizes[i];
  };

  // Check if file is an image
  const isImageFile = (mimeType: string): boolean => {
    return mimeType.startsWith("image/");
  };

  // Handle file drop/selection
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newItems: UploadQueueItem[] = acceptedFiles.map((file) => {
        const id = `${Date.now()}-${Math.random()}`;

        // Validate file
        let error: string | undefined;
        if (!isValidFileType(file)) {
          error = t("invalidFileType", {
            allowed: collection.allowed_mime_types.join(","),
          });
        } else if (!isValidFileSize(file)) {
          error = t("fileTooLarge", {
            max: formatFileSize(collection.max_file_size),
          });
        }

        return {
          id,
          file,
          collectionId: collection.id,
          status: error ? "error" : "pending",
          progress: 0,
          error,
        };
      });

      setUploadQueue((prev) => [...prev, ...newItems]);
    },
    [collection, isValidFileType, isValidFileSize, t],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: collection.allowed_mime_types.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
  });

  // Upload a single file
  const uploadFile = useCallback(
    async (item: UploadQueueItem) => {
      if (item.status === "error" && item.error) return;

      setCurrentUploadId(item.id);
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "uploading", progress: 0 } : i,
        ),
      );

      try {
        const result = await uploadAsset({
          file: item.file,
          collection_id: item.collectionId,
          alt_text: altTexts[item.id] || undefined,
        });

        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "success", progress: 100, result }
              : i,
          ),
        );

        toast.success(t("uploadSuccess", { filename: item.file.name }));

        // Auto-remove successful upload after 3 seconds
        setTimeout(() => {
          setUploadQueue((prev) => prev.filter((i) => i.id !== item.id));
          setAltTexts((prev) => {
            const { [item.id]: _, ...rest } = prev;
            return rest;
          });
        }, 3000);

        onUploadComplete?.();
      } catch (error: any) {
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error",
                  error: error.message || t("uploadError"),
                }
              : i,
          ),
        );
        toast.error(t("uploadError"));
      } finally {
        setCurrentUploadId(null);
      }
    },
    [uploadAsset, altTexts, t, onUploadComplete],
  );

  // Update progress for current upload
  useEffect(() => {
    if (currentUploadId && uploadProgress > 0) {
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === currentUploadId ? { ...i, progress: uploadProgress } : i,
        ),
      );
    }
  }, [currentUploadId, uploadProgress]);

  // Upload all pending files
  const uploadAll = useCallback(async () => {
    const pendingItems = uploadQueue.filter((i) => i.status === "pending");
    for (const item of pendingItems) {
      await uploadFile(item);
    }
  }, [uploadQueue, uploadFile]);

  // Remove item from queue
  const removeItem = useCallback((id: string) => {
    setUploadQueue((prev) => prev.filter((i) => i.id !== id));
    setAltTexts((prev) => {
      const { [id]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Retry failed upload
  const retryUpload = useCallback(
    (item: UploadQueueItem) => {
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: "pending", error: undefined } : i,
        ),
      );
      uploadFile({ ...item, status: "pending", error: undefined });
    },
    [uploadFile],
  );

  const pendingCount = uploadQueue.filter((i) => i.status === "pending").length;
  const uploadingCount = uploadQueue.filter(
    (i) => i.status === "uploading",
  ).length;

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
 border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
 transition-all duration-200
 ${
   isDragActive
     ? "border-blue-500 bg-blue-500/10"
     : "border-border hover:border-border bg-default-100"
 }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg text-foreground mb-2">
          {isDragActive ? t("dropFilesHere") : t("dragDropFiles")}
        </p>
        <p className="text-sm text-muted-foreground">{t("orClickToSelect")}</p>
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>
            {t("allowedTypes")}: {collection.allowed_mime_types.join(",")}
          </p>
          <p>
            {t("maxFileSize")}: {formatFileSize(collection.max_file_size)}
          </p>
        </div>
      </div>

      {/* Validation errors */}
      {uploadQueue.some((i) => i.status === "error" && i.error) && (
        <Alert
          color="danger"
          title={t("validationErrors")}
          description={t("fixErrorsBeforeUpload")}
        />
      )}

      {/* Upload queue */}
      {uploadQueue.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              {t("uploadQueue")} ({uploadQueue.length})
            </h3>
            {pendingCount > 0 && (
              <Button
                onClick={uploadAll}
                disabled={uploadingCount > 0}
                className="bg-blue-600 text-white hover:bg-blue-700"
                startContent={<Upload className="h-4 w-4" />}
              >
                {t("uploadAll")} ({pendingCount})
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="bg-default-100 border border-border rounded-lg p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Preview thumbnail for images */}
                  {isImageFile(item.file.type) && (
                    <div className="flex-shrink-0 w-16 h-16 bg-default-100 rounded overflow-hidden">
                      <img
                        src={URL.createObjectURL(item.file)}
                        alt={item.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!isImageFile(item.file.type) && (
                    <div className="flex-shrink-0 w-16 h-16 bg-default-100 rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}

                  {/* File info and controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.file.size)} • {item.file.type}
                        </p>
                      </div>

                      {/* Status chip */}
                      <div className="flex items-center gap-2">
                        {item.status === "pending" && (
                          <Chip size="sm" color="default" variant="flat">
                            {t("statusPending")}
                          </Chip>
                        )}
                        {item.status === "uploading" && (
                          <Chip size="sm" color="primary" variant="flat">
                            {t("statusUploading")}
                          </Chip>
                        )}
                        {item.status === "success" && (
                          <Chip
                            size="sm"
                            color="success"
                            variant="flat"
                            startContent={<CheckCircle className="h-3 w-3" />}
                          >
                            {t("statusSuccess")}
                          </Chip>
                        )}
                        {item.status === "error" && (
                          <Chip
                            size="sm"
                            color="danger"
                            variant="flat"
                            startContent={<AlertCircle className="h-3 w-3" />}
                          >
                            {t("statusError")}
                          </Chip>
                        )}

                        {/* Remove button */}
                        {item.status !== "uploading" && (
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onClick={() => removeItem(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Alt text input for images */}
                    {isImageFile(item.file.type) &&
                      item.status === "pending" && (
                        <Input
                          size="sm"
                          placeholder={t("altTextPlaceholder")}
                          value={altTexts[item.id] || ""}
                          onChange={(e) =>
                            setAltTexts((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          classNames={{
                            input: "bg-card text-foreground",
                            inputWrapper: "bg-card border border-border",
                          }}
                          className="mb-2"
                        />
                      )}

                    {/* Progress bar */}
                    {item.status === "uploading" && (
                      <Progress
                        value={item.progress}
                        size="sm"
                        color="primary"
                        className="mb-2"
                      />
                    )}

                    {/* Error message */}
                    {item.status === "error" && item.error && (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-red-400">{item.error}</p>
                        <Button
                          size="sm"
                          variant="flat"
                          color="danger"
                          onClick={() => retryUpload(item)}
                          startContent={<RefreshCw className="h-3 w-3" />}
                        >
                          {t("retry")}
                        </Button>
                      </div>
                    )}

                    {/* Upload button for individual file */}
                    {item.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => uploadFile(item)}
                        disabled={uploadingCount > 0}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {t("upload")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
