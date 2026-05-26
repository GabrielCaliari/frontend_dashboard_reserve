"use client";

import { useState } from "react";
import {
  Button,
  Chip,
  Skeleton,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { toast } from "react-hot-toast";
import {
  Plus,
  RefreshCw,
  Pencil,
  Archive,
  Package,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlans } from "@/src/common/hooks/payments/use-plans";
import { useArchivePlan } from "@/src/common/hooks/payments/use-archive-plan";
import { useDeletePlan } from "@/src/common/hooks/payments/use-delete-plan";
import { PlanForm } from "./plan-form";
import type { StripePlan, PlanBillingInterval } from "@/src/common/@types/@payments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(unitAmount / 100);
}

function hasTrial(plan: StripePlan): boolean {
  return plan.trial_days > 0 && plan.credits_released_trial_period > 0;
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: StripePlan;
  onEdit: (plan: StripePlan) => void;
  onArchive: (plan: StripePlan) => void;
  onDelete: (plan: StripePlan) => void;
}

function PlanCard({ plan, onEdit, onArchive, onDelete }: PlanCardProps) {
  const t = useTranslations("payments.products");

  const BILLING_INTERVAL_LABELS: Record<PlanBillingInterval, string> = {
    1: t("intervalWeekly"),
    2: t("intervalMonthly"),
    3: t("intervalQuarterly"),
    4: t("intervalAnnual"),
  };

  return (
    <div
      className={`p-5 rounded-xl border transition-colors ${
        plan.active
          ? "bg-muted border-[#2a2a3e] hover:border-[#3a3a4e]"
          : "bg-[#111118] border-border opacity-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{plan.plan_name}</h3>
              {!plan.active && (
                <Chip size="sm" color="default" variant="flat">
                  Arquivado
                </Chip>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{plan.slug}</p>
          </div>
        </div>

        {/* Price badge */}
        <div className="text-right flex-shrink-0">
          <p className="text-base font-bold text-foreground">
            {formatPrice(plan.unit_amount, plan.currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            / {BILLING_INTERVAL_LABELS[plan.billing_interval]}
          </p>
        </div>
      </div>

      {/* Description */}
      {plan.description && (
        <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>
      )}

      {/* Trial badge */}
      {hasTrial(plan) && (
        <div className="flex items-center gap-1.5 mb-4">
          <Clock className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <span className="text-xs text-foreground">
            {t("trialDays", { days: plan.trial_days })}
          </span>
        </div>
      )}

      {/* Stripe IDs */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t("productId")}</span>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {plan.stripe_product_id}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t("priceId")}</span>
          <span className="text-xs text-muted-foreground font-mono truncate">
            {plan.stripe_price_id}
          </span>
        </div>
        {plan.stripe_trial_price_id && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t("trialId")}</span>
            <span className="text-xs text-muted-foreground font-mono truncate">
              {plan.stripe_trial_price_id}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {plan.active ? (
        <div className="flex items-center gap-2 pt-3 border-t border-[#2a2a3e]">
          <Button
            size="sm"
            variant="flat"
            startContent={<Pencil className="w-3.5 h-3.5" />}
            onPress={() => onEdit(plan)}
            className="flex-1"
          >
            {t("edit")}
          </Button>
          <Button
            size="sm"
            variant="flat"
            color="warning"
            startContent={<Archive className="w-3.5 h-3.5" />}
            onPress={() => onArchive(plan)}
            className="flex-1"
          >
            {t("archive")}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-3 border-t border-[#2a2a3e]">
          <Button
            size="sm"
            variant="flat"
            color="danger"
            startContent={<Trash2 className="w-3.5 h-3.5" />}
            onPress={() => onDelete(plan)}
            className="w-full"
          >
            {t("delete")}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function PlansSection() {
  const t = useTranslations("payments.products");
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlan, setEditingPlan] = useState<StripePlan | null>(null);
  const [archivingPlan, setArchivingPlan] = useState<StripePlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<StripePlan | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { data: plans = [], isLoading, refetch } = usePlans();
  const archivePlan = useArchivePlan();
  const deletePlan = useDeletePlan();

  const activePlans = plans.filter((p) => p.active);
  const archivedPlans = plans.filter((p) => !p.active);

  const handleArchiveConfirm = async () => {
    if (!archivingPlan) return;
    try {
      await archivePlan.mutateAsync(archivingPlan.id);
      toast.success(t("archiveSuccess", { name: archivingPlan.plan_name }));
      setArchivingPlan(null);
    } catch (error: any) {
      toast.error(error?.message || t("archiveError"));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPlan) return;
    try {
      await deletePlan.mutateAsync(deletingPlan.id);
      toast.success(t("deleteSuccess", { name: deletingPlan.plan_name }));
      setDeletingPlan(null);
    } catch (error: any) {
      toast.error(error?.message || t("deleteError"));
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Create / Edit form ──
  if (isCreating || editingPlan) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {editingPlan ? t("editPlan", { name: editingPlan.plan_name }) : t("newPlanTitle")}
          </h2>
          <Button
            variant="flat"
            size="sm"
            onPress={() => {
              setIsCreating(false);
              setEditingPlan(null);
            }}
          >
            {t("cancel")}
          </Button>
        </div>

        {editingPlan && (
          <div className="p-3 rounded-lg bg-yellow-950/30 border border-yellow-800/50">
            <p className="text-xs text-yellow-300">
              <strong>{t("immutableWarningTitle")}</strong> {t("immutableWarning")}
            </p>
          </div>
        )}

        <PlanForm
          existing={editingPlan ?? undefined}
          onSuccess={() => {
            setIsCreating(false);
            setEditingPlan(null);
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingPlan(null);
          }}
        />
      </div>
    );
  }

  // ── List ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
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
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsCreating(true)}
          >
            {t("newPlan")}
          </Button>
        </div>
      </div>

      {/* Active plans */}
      {activePlans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 gap-4 rounded-xl bg-muted border border-[#2a2a3e]">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Package className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">{t("noPlans")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("noPlansDesc")}</p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsCreating(true)}
          >
            {t("createFirst")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={setEditingPlan}
              onArchive={setArchivingPlan}
              onDelete={setDeletingPlan}
            />
          ))}
        </div>
      )}

      {/* Archived plans (collapsible) */}
      {archivedPlans.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showArchived ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            {t("archived")} ({archivedPlans.length})
          </button>

          {showArchived && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {archivedPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={setEditingPlan}
                  onArchive={setArchivingPlan}
                  onDelete={setDeletingPlan}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Archive confirmation modal */}
      <Modal
        isOpen={!!archivingPlan}
        onClose={() => setArchivingPlan(null)}
        classNames={{
          base: "bg-background border border-border",
          header: "border-b border-border",
          footer: "border-t border-border",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-base font-semibold text-foreground">{t("archiveTitle")}</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-foreground">
              {t("archiveConfirm", { name: archivingPlan?.plan_name ?? "" })}
            </p>
            <div className="mt-3 p-3 rounded-lg bg-muted border border-[#2a2a3e] space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-foreground">{t("archiveNote1")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-foreground">{t("archiveNote2")}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs text-foreground">{t("archiveNote3")}</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setArchivingPlan(null)}
              isDisabled={archivePlan.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              color="warning"
              startContent={<Archive className="w-4 h-4" />}
              isLoading={archivePlan.isPending}
              onPress={handleArchiveConfirm}
            >
              {t("archiveBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        classNames={{
          base: "bg-background border border-border",
          header: "border-b border-border",
          footer: "border-t border-border",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-base font-semibold text-foreground">{t("deleteTitle")}</h3>
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-foreground">
              {t("deleteConfirm", { name: deletingPlan?.plan_name ?? "" })}
            </p>
            <div className="mt-3 p-3 rounded-lg bg-red-950/30 border border-red-800/50">
              <p className="text-xs text-red-300">
                <strong>{t("deleteWarningTitle")}</strong> {t("deleteWarningDesc")}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              onPress={() => setDeletingPlan(null)}
              isDisabled={deletePlan.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
              isLoading={deletePlan.isPending}
              onPress={handleDeleteConfirm}
            >
              {t("deleteBtn")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
