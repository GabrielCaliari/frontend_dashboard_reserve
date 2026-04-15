"use client";

import type React from "react";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/presentation/components/atoms/shadcn-ui/dialog";
import { Button } from "@/src/presentation/components/atoms/shadcn-ui/button";
import { Alert, AlertDescription } from "@/src/presentation/components/atoms/shadcn-ui/alert";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, CheckCircle, FileText } from "lucide-react";
import { uploadLeads } from "@/src/presentation/actions/email-campaign/upload-leads";
import { useTranslations } from "next-intl";

interface LeadUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
}

export function LeadUploadDialog({
  isOpen,
  onClose,
  campaignId,
}: LeadUploadDialogProps) {
  const router = useRouter();
  const t = useTranslations("leadUpload");
  const tc = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Verificar se é um arquivo CSV
      if (!selectedFile.name.endsWith(".csv")) {
        setError(t("csvFormatError"));
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) {
      // Verificar se é um arquivo CSV
      if (!droppedFile.name.endsWith(".csv")) {
        setError(t("csvFormatError"));
        setFile(null);
        return;
      }

      setFile(droppedFile);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t("selectCsvFile"));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Chamar a server action para upload dos leads
      const result = await uploadLeads(campaignId, file);

      if (result?.error) {
        setError(result.message || t("uploadError"));
        setIsUploading(false);
        return;
      }

      setSuccess(true);
      setIsUploading(false);

      setTimeout(() => {
        router.refresh();
        onClose();
      }, 2000);
    } catch (err) {
      console.error(t("processError"), err);
      setError(t("processErrorDetail"));
      setIsUploading(false);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFile(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
        if (!isUploading) resetFileInput();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div
            className={`
 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
 ${error ? "border-red-300 bg-red-50" : "border-border hover:border-emerald-300 hover:bg-emerald-50"}
 ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
 transition-colors`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {!file && !success && (
              <>
                <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {t("clickToSelect")}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("emailColumnOnly")}
                </p>
              </>
            )}

            {file && !success && (
              <div className="text-sm">
                <FileText className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-muted-foreground text-xs mt-1">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}

            {success && (
              <div className="text-sm">
                <CheckCircle className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                <p className="font-medium text-emerald-700">
                  {t("uploadSuccess")}
                </p>
              </div>
            )}

            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {file && !error && !success && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("clickUpload")}
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading}
          >
            {tc("cancel")}
          </Button>

          <div className="flex gap-2">
            {file && !success && (
              <Button
                type="button"
                variant="ghost"
                onClick={resetFileInput}
                disabled={isUploading}
              >
                {t("clear")}
              </Button>
            )}

            <Button
              type="button"
              onClick={handleUpload}
              disabled={!file || isUploading || success}
            >
              {isUploading ? t("processing") : t("upload")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
