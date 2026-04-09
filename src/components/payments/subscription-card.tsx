"use client";

import { Chip } from "@heroui/react";
import {
  Calendar,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import type {
  Subscription,
  SubscriptionStatus,
} from "@/src/common/@types/@payments";

const STATUS_ICON: Record<SubscriptionStatus, any> = {
  active: CheckCircle,
  trialing: Clock,
  past_due: AlertTriangle,
  canceled: XCircle,
  incomplete: Clock,
  incomplete_expired: XCircle,
  unpaid: AlertTriangle,
  paused: Pause,
};

const STATUS_COLOR: Record<
  SubscriptionStatus,
  "success" | "warning" | "danger" | "default" | "primary"
> = {
  active: "success",
  trialing: "primary",
  past_due: "warning",
  canceled: "danger",
  incomplete: "warning",
  incomplete_expired: "danger",
  unpaid: "danger",
  paused: "default",
};

const INTERVAL_LABELS: Record<string, string> = {
  month: "mês",
  year: "ano",
  week: "semana",
  day: "dia",
};

interface SubscriptionCardProps {
  subscription: Subscription;
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const t = useTranslations("payments.subscriptions");

  const StatusIcon = STATUS_ICON[subscription.status] ?? CreditCard;
  const statusColor = STATUS_COLOR[subscription.status] ?? "default";

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy");
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = (status: SubscriptionStatus): string => {
    const map: Record<SubscriptionStatus, string> = {
      active: t("statusActive"),
      trialing: t("statusTrialing"),
      past_due: t("statusPastDue"),
      canceled: t("statusCanceled"),
      incomplete: t("statusIncomplete"),
      incomplete_expired: t("statusIncompleteExpired"),
      unpaid: t("statusUnpaid"),
      paused: t("statusPaused"),
    };
    return map[status] ?? status;
  };

  return (
    <div className="p-5 rounded-xl bg-default-100 border border-[#2a2a3e] space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Stripe Subscription
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {subscription.stripeSubscriptionId}
            </p>
          </div>
        </div>
        <Chip
          size="sm"
          color={statusColor}
          variant="flat"
          startContent={<StatusIcon className="w-3 h-3" />}
        >
          {getStatusLabel(subscription.status)}
        </Chip>
      </div>

      {/* Amount */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-foreground">
          {formatCurrency(subscription.formattedAmount, subscription.currency)}
        </span>
        <span className="text-sm text-muted-foreground">
          /{" "}
          {subscription.intervalCount > 1
            ? `${subscription.intervalCount}`
            : ""}
          {INTERVAL_LABELS[subscription.interval] || subscription.interval}
        </span>
      </div>

      {/* Period */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            {t("periodStart")}
          </span>
          <span className="text-sm text-foreground">
            {formatDate(subscription.currentPeriodStart)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">
            {t("periodEnd")}
          </span>
          <span className="text-sm text-foreground">
            {formatDate(subscription.currentPeriodEnd)}
          </span>
        </div>
      </div>

      {/* Days remaining */}
      {subscription.isActive && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-[#2a2a3e]">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">
            {t("daysRemaining", { days: subscription.daysRemaining })}
          </span>
        </div>
      )}

      {/* Trial info */}
      {subscription.isInTrial && subscription.trialEnd && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm text-foreground">
            {t("trialUntil", { date: formatDate(subscription.trialEnd) })}
          </span>
        </div>
      )}

      {/* Cancel at period end warning */}
      {subscription.cancelAtPeriodEnd && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-950/30 border border-orange-800/50">
          <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
          <span className="text-sm text-orange-300">
            {t("canceledAtPeriodEnd", {
              date: formatDate(subscription.currentPeriodEnd),
            })}
          </span>
        </div>
      )}

      {/* IDs */}
      <div className="pt-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {t("customerId")}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {subscription.stripeCustomerId}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{t("priceId")}</span>
          <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
            {subscription.stripePriceId}
          </span>
        </div>
      </div>
    </div>
  );
}
