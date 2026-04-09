"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Settings, CheckCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateCampaignBatchSize } from "@/src/common/actions/email-campaign/update-campaign-batch-size";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
interface BatchSizeConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  currentBatchSize?: number;
  totalLeads: number;
}

export function BatchSizeConfigDialog({
  isOpen,
  onClose,
  campaignId,
  currentBatchSize = 300,
  totalLeads,
}: BatchSizeConfigDialogProps) {
  const router = useRouter();
  const t = useTranslations();
  const [batchSize, setBatchSize] = useState(currentBatchSize);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular o número de disparos necessários
  const totalBatches = batchSize > 0 ? Math.ceil(totalLeads / batchSize) : 0;

  const handleSubmit = async () => {
    // Validação
    if (!batchSize || batchSize < 100) {
      setError(t("batchSize.minError"));
      return;
    }

    if (batchSize > 1000) {
      setError(t("batchSize.maxWarning"));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await updateCampaignBatchSize(campaignId, batchSize);

      if (response?.error) {
        toast.error(response.message);
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);

      // Atualizar a UI após um breve delay
      setTimeout(() => {
        router.refresh();
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(t("batchSize.saveError"));
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setBatchSize(currentBatchSize);
    setSuccess(false);
    setError(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
        if (!isSubmitting && !open) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t("batchSize.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!success ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("batchSize.description")}
              </p>

              <div className="space-y-2">
                <Label htmlFor="batch-size">
                  {t("batchSize.leadsPerBatch")}
                </Label>
                <Input
                  id="batch-size"
                  type="number"
                  min="1"
                  value={batchSize}
                  onChange={(e) =>
                    setBatchSize(Number.parseInt(e.target.value) || 0)
                  }
                  className="mt-1"
                  disabled={isSubmitting}
                />
                {error && (
                  <div className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {error}
                  </div>
                )}
              </div>

              {totalLeads > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <h4 className="text-sm font-medium text-blue-700">
                    {t("batchSize.summary")}
                  </h4>
                  <ul className="text-xs text-blue-600 mt-2 space-y-1">
                    <li>
                      {t("batchSize.totalLeads")} {totalLeads}
                    </li>
                    <li>
                      {t("batchSize.leadsPerBatchLabel")} {batchSize}
                    </li>
                    <li>
                      {t("batchSize.batchesNeeded")} {totalBatches}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
              <h3 className="text-lg font-medium text-emerald-700">
                {t("batchSize.savedSuccess")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("batchSize.savedMessage", { count: batchSize })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          {!success ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t("common.saving") : t("batchSize.saveConfig")}
              </Button>
            </>
          ) : (
            <Button type="button" onClick={onClose} className="mx-auto">
              {t("common.close")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
