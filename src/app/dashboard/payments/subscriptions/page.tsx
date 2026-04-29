"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Select,
  SelectItem,
  Skeleton,
} from "@heroui/react";
import {
  RefreshCw,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  FileX,
  X,
  ExternalLink,
} from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { usePaymentMovements } from "@/src/common/hooks/payments/use-payment-movements";
import type {
  PaymentMovement,
  MovementType,
  MovementStatus,
} from "@/src/common/@types/@payment-movements";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

const TYPE_COLORS: Record<MovementType, "secondary" | "primary"> = {
  subscription: "secondary",
  one_time: "primary",
};

const STATUS_COLORS: Record<
  MovementStatus,
  "success" | "warning" | "danger" | "default" | "secondary"
> = {
  completed: "success",
  active: "success",
  trialing: "secondary",
  pending: "warning",
  past_due: "warning",
  incomplete: "warning",
  abandoned: "danger",
  canceled: "default",
  refunded: "default",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30;

export default function PaymentsSubscriptionsPage() {
  const t = useTranslations("payments.movementsPage");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  const page = Number(searchParams.get("page") || "1");
  const typeFilter = (searchParams.get("type") || "all") as MovementType | "all";
  const statusFilter = (searchParams.get("status") || "all") as MovementStatus | "all";

  const { data, isLoading, refetch } = usePaymentMovements({
    type: typeFilter,
    status: statusFilter,
    limit: 500,
  });

  const allMovements = data?.data ?? [];
  const totalCount = allMovements.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const paginatedMovements = allMovements.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const hasAnyFilter = typeFilter !== "all" || statusFilter !== "all";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/dashboard/payments/subscriptions?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/dashboard/payments/subscriptions");
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/dashboard/payments/subscriptions?${params.toString()}`);
  };

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    if (page <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
      pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const firstItem = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(page * PAGE_SIZE, totalCount);

  const subtitle = isLoading
    ? t("subtitleLoading")
    : totalCount === 1
    ? t("subtitleCount", { count: totalCount })
    : t("subtitleCountPlural", { count: totalCount });

  const COLUMNS = [
    { key: "customer", label: t("columnCustomer") },
    { key: "product", label: t("columnProduct") },
    { key: "type", label: t("columnType") },
    { key: "amount", label: t("columnAmount") },
    { key: "status", label: t("columnStatus") },
    { key: "date", label: t("columnDate") },
    { key: "actions", label: "" },
  ];

  const TYPE_LABELS: Record<MovementType, string> = {
    subscription: t("typeSubscription"),
    one_time: t("typeOneTime"),
  };

  const STATUS_LABELS: Record<MovementStatus, string> = {
    completed: t("statusCompleted"),
    active: t("statusActive"),
    pending: t("statusPending"),
    abandoned: t("statusAbandoned"),
    canceled: t("statusCanceled"),
    refunded: t("statusRefunded"),
    trialing: t("statusTrialing"),
    past_due: t("statusPastDue"),
    incomplete: t("statusIncomplete"),
  };

  const renderCell = (movement: PaymentMovement, key: string) => {
    switch (key) {
      case "customer":
        return (
          <div>
            <p className="font-medium text-gray-100">
              {movement.customerName || movement.customerEmail}
            </p>
            {movement.customerName && (
              <p className="text-xs text-gray-500">{movement.customerEmail}</p>
            )}
          </div>
        );
      case "product":
        return (
          <p className="text-sm text-gray-200">{movement.productName || "—"}</p>
        );
      case "type":
        return (
          <Chip color={TYPE_COLORS[movement.type]} variant="flat" size="sm">
            {TYPE_LABELS[movement.type]}
          </Chip>
        );
      case "amount":
        return (
          <span className="font-semibold text-gray-100">
            {formatPrice(movement.amount, movement.currency)}
          </span>
        );
      case "status":
        return (
          <div className="flex flex-col gap-1">
            <Chip color={STATUS_COLORS[movement.status]} variant="flat" size="sm">
              {STATUS_LABELS[movement.status] ?? movement.status}
            </Chip>
            {movement.cancelAtPeriodEnd && (
              <Chip size="sm" variant="flat" color="warning">
                {t("cancelAtPeriodEnd")}
              </Chip>
            )}
          </div>
        );
      case "date":
        return (
          <span className="text-sm text-gray-400">
            {formatDate(movement.createdAt)}
          </span>
        );
      case "actions": {
        // Use pre-computed stripeLink if available, otherwise build from subscription id
        const link =
          movement.stripeLink ??
          (movement.stripeSubscriptionId
            ? `https://dashboard.stripe.com/test/subscriptions/${movement.stripeSubscriptionId}`
            : null);

        if (!link) return null;

        return (
          <Button
            size="sm"
            variant="light"
            isIconOnly
            onPress={() => window.open(link, "_blank")}
            aria-label={t("viewOnStripe")}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        );
      }
      default:
        return null;
    }
  };

  return (
    <LayoutScopeRoot>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <CreditCard className="w-6 h-6" />
              {t("title")}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          </div>
          <Button
            variant="flat"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={() => refetch()}
            isLoading={isLoading}
            size="sm"
          >
            {t("refresh")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[typeFilter]}
            onChange={(e) => updateParam("type", e.target.value)}
            aria-label={t("allTypes")}
            className="w-44"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            <SelectItem key="all" value="all">{t("allTypes")}</SelectItem>
            <SelectItem key="subscription" value="subscription">{t("typeSubscription")}</SelectItem>
            <SelectItem key="one_time" value="one_time">{t("typeOneTime")}</SelectItem>
          </Select>

          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[statusFilter]}
            onChange={(e) => updateParam("status", e.target.value)}
            aria-label={t("allStatuses")}
            className="w-48"
            classNames={{ trigger: "border-gray-700 bg-gray-900/50" }}
          >
            <SelectItem key="all" value="all">{t("allStatuses")}</SelectItem>
            <SelectItem key="active" value="active">{t("statusActive")}</SelectItem>
            <SelectItem key="completed" value="completed">{t("statusCompleted")}</SelectItem>
            <SelectItem key="pending" value="pending">{t("statusPending")}</SelectItem>
            <SelectItem key="trialing" value="trialing">{t("statusTrialing")}</SelectItem>
            <SelectItem key="abandoned" value="abandoned">{t("statusAbandoned")}</SelectItem>
            <SelectItem key="canceled" value="canceled">{t("statusCanceled")}</SelectItem>
            <SelectItem key="refunded" value="refunded">{t("statusRefunded")}</SelectItem>
            <SelectItem key="past_due" value="past_due">{t("statusPastDue")}</SelectItem>
          </Select>

          {hasAnyFilter && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              startContent={<X className="w-3.5 h-3.5" />}
              onPress={clearFilters}
            >
              {t("clearFilters")}
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <Table
            aria-label={t("title")}
            classNames={{
              wrapper: "rounded-xl border border-[#1f1f2e]",
              th: "bg-[#1a1a2e] text-xs font-semibold uppercase tracking-wider text-gray-400",
              tr: "hover:bg-[#1a1a2e]/50 transition-colors",
            }}
          >
            <TableHeader columns={COLUMNS}>
              {(col) => (
                <TableColumn key={col.key}>{col.label.toUpperCase()}</TableColumn>
              )}
            </TableHeader>
            <TableBody
              items={paginatedMovements}
              isLoading={isLoading}
              loadingContent={
                <div className="p-4 space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-lg" />
                  ))}
                </div>
              }
              emptyContent={
                <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
                  <FileX className="w-10 h-10 opacity-40" />
                  <p className="text-sm font-medium">
                    {hasAnyFilter ? t("noMovementsFiltered") : t("noMovements")}
                  </p>
                  {hasAnyFilter && (
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={clearFilters}
                      startContent={<X className="w-3.5 h-3.5" />}
                    >
                      {t("clearFilters")}
                    </Button>
                  )}
                </div>
              }
            >
              {(movement) => (
                <TableRow key={movement.id}>
                  {(col) => (
                    <TableCell>{renderCell(movement, col as string)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              {t("showing", { first: firstItem, last: lastItem, total: totalCount })}
            </p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  isDisabled={page <= 1}
                  onPress={() => handlePageChange(page - 1)}
                  aria-label={t("previous")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${i}`}
                      className="px-2 text-sm text-gray-500 select-none"
                    >
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      isIconOnly
                      size="sm"
                      variant={p === page ? "solid" : "flat"}
                      color={p === page ? "primary" : "default"}
                      onPress={() => handlePageChange(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  isDisabled={page >= totalPages}
                  onPress={() => handlePageChange(page + 1)}
                  aria-label={t("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutScopeRoot>
  );
}
