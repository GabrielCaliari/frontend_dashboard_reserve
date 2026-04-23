"use client";

import { useState } from "react";
import {
  Button,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { toast } from "react-hot-toast";
import { CreditCard, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSubscription } from "@/src/common/hooks/payments/use-subscription";
import { useBillingConfig } from "@/src/common/hooks/payments/use-billing-config";
import { useCreateCheckoutSession } from "@/src/common/hooks/payments/use-create-checkout-session";
import { useCancelSubscription } from "@/src/common/hooks/payments/use-cancel-subscription";
import { SubscriptionCard } from "./subscription-card";
import { useTenantStore } from "@/src/common/stores/tenant-store";

export function SubscriptionsSection() {
  const t = useTranslations("payments.subscriptions");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelImmediately, setCancelImmediately] = useState(false);

  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const { data: subscriptionData, isLoading: isLoadingSub, refetch } = useSubscription();
  const { data: billingConfig, isLoading: isLoadingConfig } = useBillingConfig();
  const createCheckout = useCreateCheckoutSession();
  const cancelSubscription = useCancelSubscription();

  const subscription = subscriptionData?.subscription;
  const isLoading = isLoadingSub || isLoadingConfig;

  const handleSubscribe = async () => {
    if (!billingConfig || !selectedTenant) {
      toast.error(t("noBillingConfigError"));
      return;
    }

    const priceId = billingConfig.stripePriceIds?.[billingConfig.billingInterval];
    if (!priceId) {
      toast.error(t("noPriceId", { interval: billingConfig.billingInterval }));
      return;
    }

    try {
      const { checkoutUrl } = await createCheckout.mutateAsync({
        tenantId: selectedTenant.id,
        priceId,
        successUrl: `${window.location.origin}/dashboard/payments/subscriptions?success=1`,
        cancelUrl: `${window.location.origin}/dashboard/payments/subscriptions?canceled=1`,
        trialPeriodDays: billingConfig.trialEnabled ? billingConfig.trialDays : undefined,
      });
      window.location.href = checkoutUrl;
    } catch (error: any) {
      toast.error(error?.message || t("checkoutError"));
    }
  };

  const handleCancel = async () => {
    if (!subscription) return;
    try {
      const result = await cancelSubscription.mutateAsync({
        subscriptionId: subscription.id,
        data: { cancelImmediately },
      });
      toast.success(
        cancelImmediately
          ? t("cancelSuccessImmediate")
          : t("cancelSuccessPeriodEnd", {
              date: new Date(result.accessUntil).toLocaleDateString("pt-BR"),
            })
      );
      setShowCancelModal(false);
    } catch (error: any) {
      toast.error(error?.message || t("cancelError"));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">{t("title")}</h2>
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          onPress={() => refetch()}
          aria-label={t("refresh")}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* No billing config warning */}
      {!billingConfig && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-950/30 border border-yellow-800/50">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-300">{t("noBillingConfig")}</p>
            <p className="text-xs text-yellow-400 mt-0.5">{t("noBillingConfigDesc")}</p>
          </div>
        </div>
      )}

      {/* No subscription */}
      {!subscription && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-200">{t("noSubscription")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("noSubscriptionDesc")}</p>
          </div>
          {billingConfig && (
            <Button
              color="primary"
              startContent={<ExternalLink className="w-4 h-4" />}
              isLoading={createCheckout.isPending}
              onPress={handleSubscribe}
            >
              {t("subscribeNow")}
            </Button>
          )}
        </div>
      )}

      {/* Active subscription */}
      {subscription && (
        <>
          <SubscriptionCard subscription={subscription} />
          {subscription.isActive && !subscription.cancelAtPeriodEnd && (
            <div className="flex justify-end">
              <Button
                color="danger"
                variant="flat"
                size="sm"
                onPress={() => setShowCancelModal(true)}
              >
                {t("cancelSubscription")}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Cancel Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        classNames={{
          base: "bg-[#0f0f1a] border border-[#1f1f2e]",
          header: "border-b border-[#1f1f2e]",
          footer: "border-t border-[#1f1f2e]",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-base font-semibold text-gray-100">{t("cancelTitle")}</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-300 mb-4">{t("cancelDesc")}</p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCancelImmediately(false)}
                className={`w-full p-4 rounded-xl border text-left transition-colors ${
                  !cancelImmediately
                    ? "border-primary bg-primary/10"
                    : "border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#3a3a4e]"
                }`}
              >
                <p className="text-sm font-medium text-gray-200">{t("cancelAtPeriodEnd")}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t("cancelAtPeriodEndDesc")}</p>
              </button>
              <button
                type="button"
                onClick={() => setCancelImmediately(true)}
                className={`w-full p-4 rounded-xl border text-left transition-colors ${
                  cancelImmediately
                    ? "border-danger bg-danger/10"
                    : "border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#3a3a4e]"
                }`}
              >
                <p className="text-sm font-medium text-gray-200">{t("cancelImmediately")}</p>
                <p className="text-xs text-red-400 mt-0.5">{t("cancelImmediatelyDesc")}</p>
              </button>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setShowCancelModal(false)}
              isDisabled={cancelSubscription.isPending}
            >
              {t("back")}
            </Button>
            <Button
              color="danger"
              isLoading={cancelSubscription.isPending}
              onPress={handleCancel}
            >
              {t("confirmCancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
