"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { ExternalLink, XCircle, Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useListB2CSubscriptions,
  useCancelB2CSubscription,
} from "@/src/common/hooks/useB2CSubscriptions";
import type { UserSubscription } from "@/src/common/@types/@b2c-products";
import { ConfirmModal } from "@/src/components/modals/confirm-modal";

export function B2CSubscriptionsTable() {
  const { data: subscriptions, isLoading } = useListB2CSubscriptions();
  const cancelMutation = useCancelB2CSubscription();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSubscription, setSelectedSubscription] =
    useState<UserSubscription | null>(null);
  const t = useTranslations("payments.b2c");

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusColor = (status: UserSubscription["status"]) => {
    const colors: Record<
      UserSubscription["status"],
      "success" | "warning" | "danger" | "default"
    > = {
      active: "success",
      trialing: "warning",
      canceled: "default",
      incomplete: "warning",
      incomplete_expired: "danger",
      past_due: "danger",
      unpaid: "danger",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status: UserSubscription["status"]) => {
    const statusKey =
      `status${status.charAt(0).toUpperCase() + status.slice(1).replace("_", "")}` as any;
    return t(statusKey);
  };

  const handleCancelClick = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    onOpen();
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscription) return;

    try {
      await cancelMutation.mutateAsync(selectedSubscription.id);
      onClose();
    } catch (error) {
      console.error(t("cancelError"), error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {t("noSubscriptions")}
      </div>
    );
  }

  return (
    <>
      <Table aria-label={t("subscriptionsTitle")}>
        <TableHeader>
          <TableColumn>{t("columnStudent").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnProduct").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnStatus").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnValue").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnPeriod").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnActions").toUpperCase()}</TableColumn>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>
                <div className="text-sm">
                  {subscription.studentEmail || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">
                  {subscription.productName || "N/A"}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <Chip
                    color={getStatusColor(subscription.status)}
                    variant="flat"
                    size="sm"
                  >
                    {getStatusLabel(subscription.status)}
                  </Chip>
                  {subscription.cancelAtPeriodEnd && (
                    <Chip size="sm" variant="flat" color="warning">
                      {t("cancelAtPeriodEnd")}
                    </Chip>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {formatPrice(subscription.amount, subscription.currency)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {formatDate(subscription.currentPeriodStart)} -{""}
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<ExternalLink className="w-4 h-4" />}
                    onPress={() =>
                      window.open(
                        `https://dashboard.stripe.com/subscriptions/${subscription.stripeSubscriptionId}`,
                        "_blank",
                      )
                    }
                  >
                    {t("viewOnStripe")}
                  </Button>
                  {subscription.status === "active" &&
                    !subscription.cancelAtPeriodEnd && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={<XCircle className="w-4 h-4" />}
                        onPress={() => handleCancelClick(subscription)}
                        isLoading={cancelMutation.isPending}
                      >
                        {t("cancelSubscription")}
                      </Button>
                    )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmModal
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={handleConfirmCancel}
        title={t("confirmCancelTitle")}
        message={t("confirmCancelMessage", {
          email: selectedSubscription?.studentEmail || "",
        })}
        confirmText={t("confirmCancelButton")}
        confirmColor="danger"
        isLoading={cancelMutation.isPending}
      />
    </>
  );
}
