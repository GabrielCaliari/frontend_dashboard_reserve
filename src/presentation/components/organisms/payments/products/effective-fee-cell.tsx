"use client";

import { Tooltip } from "@heroui/react";
import { Percent, Truck, Package, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useB2BProductCost,
  useB2CProductCost,
  type CalculatedCost,
} from "@/src/shared/hooks/payments/use-b2c-fees";

type FeeSource = "product" | "category" | "global" | "none";

function sourceColor(s: FeeSource) {
  return s === "product"
    ? "text-primary"
    : s === "category"
      ? "text-secondary"
      : s === "global"
        ? "text-muted-foreground"
        : "text-muted-foreground";
}

// ─── Effective fee display (chip cost + shipping source) ──────────────────────

function EffectiveFeeDisplay({
  cost,
  isLoading,
}: {
  cost: CalculatedCost | undefined;
  isLoading: boolean;
}) {
  const t = useTranslations("payments.productsPage");

  if (isLoading)
    return (
      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
    );
  if (!cost)
    return <span className="text-xs text-muted-foreground italic">—</span>;

  const sourceLabel = (s: FeeSource) =>
    t(`feesSource${s.charAt(0).toUpperCase() + s.slice(1)}` as any);

  return (
    <div className="flex flex-col gap-1">
      {cost.chipCostSource !== "none" ? (
        <Tooltip
          content={`${t("feesChipCost")} — ${sourceLabel(cost.chipCostSource)}`}
        >
          <div
            className={`flex items-center gap-1 text-xs font-medium ${sourceColor(cost.chipCostSource)}`}
          >
            <Percent className="w-3 h-3 shrink-0" />
            <span>{cost.chipCostPercent}%</span>
            <span className="text-[10px] opacity-60 font-normal">
              ({sourceLabel(cost.chipCostSource)})
            </span>
          </div>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-1 text-xs text-muted-foreground italic">
          <Percent className="w-3 h-3" />
          {t("feesNoChipCost")}
        </div>
      )}

      {cost.requiresShipping &&
        (cost.shippingFeeSource !== "none" && cost.shippingFee > 0 ? (
          <Tooltip
            content={`${t("feesShipping")} — ${sourceLabel(cost.shippingFeeSource)}`}
          >
            <div
              className={`flex items-center gap-1 text-xs font-medium ${sourceColor(cost.shippingFeeSource)}`}
            >
              <Truck className="w-3 h-3 shrink-0" />
              <span>{fmtCents(cost.shippingFee, cost.currency)}</span>
              <span className="text-[10px] opacity-60 font-normal">
                ({sourceLabel(cost.shippingFeeSource)})
              </span>
            </div>
          </Tooltip>
        ) : (
          <Tooltip content={t("feesPhysicalTooltip")}>
            <div className="flex items-center gap-1 text-xs text-amber-400/70">
              <Package className="w-3 h-3" />
              {t("feesShippingNotConfigured")}
            </div>
          </Tooltip>
        ))}
    </div>
  );
}

// ─── Final price breakdown ────────────────────────────────────────────────────

function FinalPriceDisplay({
  cost,
  isLoading,
}: {
  cost: CalculatedCost | undefined;
  isLoading: boolean;
}) {
  const t = useTranslations("payments.productsPage");

  if (isLoading)
    return (
      <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
    );
  if (!cost)
    return <span className="text-xs text-muted-foreground italic">—</span>;

  const hasAnyFee = cost.chipCostAmount > 0 || cost.shippingFee > 0;

  return (
    <span className="text-sm font-medium text-foreground">
      {fmtCents(hasAnyFee ? cost.total : cost.basePrice, cost.currency)}
    </span>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCents(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

// ─── B2B exports ─────────────────────────────────────────────────────────────

export function B2BEffectiveFeeCell({ productId }: { productId: string }) {
  const { data: cost, isLoading } = useB2BProductCost(productId);
  return <EffectiveFeeDisplay cost={cost} isLoading={isLoading} />;
}

export function B2BFinalPriceCell({ productId }: { productId: string }) {
  const { data: cost, isLoading } = useB2BProductCost(productId);
  return <FinalPriceDisplay cost={cost} isLoading={isLoading} />;
}

// ─── B2C exports ─────────────────────────────────────────────────────────────

export function B2CEffectiveFeeCell({ productId }: { productId: string }) {
  const { data: cost, isLoading } = useB2CProductCost(productId);
  return <EffectiveFeeDisplay cost={cost} isLoading={isLoading} />;
}

export function B2CFinalPriceCell({ productId }: { productId: string }) {
  const { data: cost, isLoading } = useB2CProductCost(productId);
  return <FinalPriceDisplay cost={cost} isLoading={isLoading} />;
}
