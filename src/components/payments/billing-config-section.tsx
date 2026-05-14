"use client";

import { useState } from "react";
import { Button, Chip, Skeleton } from "@heroui/react";
import { toast } from "react-hot-toast";
import { CheckCircle, XCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBillingConfig } from "@/src/common/hooks/payments/use-billing-config";
import { useDeleteBillingConfig } from "@/src/common/hooks/payments/use-delete-billing-config";
import { BillingConfigForm } from "./billing-config-form";

interface StatusBadgeProps {
  label: string;
  configured: boolean;
  configuredLabel: string;
  notConfiguredLabel: string;
}

function StatusBadge({ label, configured, configuredLabel, notConfiguredLabel }: StatusBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      {configured ? (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      )}
      <span className="text-sm text-gray-300">{label}</span>
      <Chip
        size="sm"
        color={configured ? "success" : "danger"}
        variant="flat"
        className="ml-auto"
      >
        {configured ? configuredLabel : notConfiguredLabel}
      </Chip>
    </div>
  );
}

export function BillingConfigSection() {
  const t = useTranslations("payments.billingConfig");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: config, isLoading, refetch } = useBillingConfig();
  const deleteConfig = useDeleteBillingConfig();

  const handleDelete = async () => {
    try {
      await deleteConfig.mutateAsync();
      toast.success(t("deleteSuccess"));
      setShowDeleteConfirm(false);
    } catch (error: any) {
      toast.error(error?.message || t("deleteError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (isEditing || !config) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">
            {config ? t("editTitle") : t("createTitle")}
          </h2>
          {config && (
            <Button variant="flat" size="sm" onPress={() => setIsEditing(false)}>
              {t("cancel")}
            </Button>
          )}
        </div>
        <BillingConfigForm
          existing={config}
          onSuccess={() => setIsEditing(false)}
          onCancel={config ? () => setIsEditing(false) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">
            {config.planName || t("title")}
          </h2>
          {config.planDescription && (
            <p className="text-sm text-gray-400 mt-1">{config.planDescription}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={() => refetch()}
            aria-label={t("refresh")}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="flat"
            startContent={<Pencil className="w-4 h-4" />}
            onPress={() => setIsEditing(true)}
          >
            {t("edit")}
          </Button>
          <Button
            size="sm"
            color="danger"
            variant="flat"
            startContent={<Trash2 className="w-4 h-4" />}
            onPress={() => setShowDeleteConfirm(true)}
          >
            {t("remove")}
          </Button>
        </div>
      </div>

      {/* Stripe Status */}
      <div className="p-4 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t("statusStripe")}
        </h3>
        <StatusBadge
          label="Stripe Secret Key"
          configured={config.hasStripeSecretKey}
          configuredLabel={t("statusConfigured")}
          notConfiguredLabel={t("statusNotConfigured")}
        />
        <StatusBadge
          label="Webhook Secret"
          configured={config.hasStripeWebhookSecret}
          configuredLabel={t("statusConfigured")}
          notConfiguredLabel={t("statusNotConfigured")}
        />
        {config.stripePublishableKey && (
          <div className="pt-1">
            <p className="text-xs text-gray-500">Publishable Key</p>
            <p className="text-xs text-gray-300 font-mono truncate">
              {config.stripePublishableKey}
            </p>
          </div>
        )}
      </div>

      {/* Metadata features */}
      {config.metadata?.features && Array.isArray(config.metadata.features) && (
        <div className="p-4 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("planFeaturesLabel")}
          </h3>
          <ul className="space-y-1.5">
            {(config.metadata.features as string[]).map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800/50 space-y-3">
          <p className="text-sm text-red-300 font-medium">{t("deleteWarningTitle")}</p>
          <p className="text-xs text-red-400">{t("deleteWarningDesc")}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              color="danger"
              isLoading={deleteConfig.isPending}
              onPress={handleDelete}
            >
              {t("confirmRemove")}
            </Button>
            <Button size="sm" variant="flat" onPress={() => setShowDeleteConfirm(false)}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
