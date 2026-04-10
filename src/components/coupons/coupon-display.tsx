"use client";

import { Chip } from "@heroui/react";
import { useTranslations, useLocale } from "next-intl";
import type { DiscountCoupon } from "@/src/shared/domain/types/@coupons";

// ---------------------------------------------------------------------------
// CouponBadgeStatus
// ---------------------------------------------------------------------------
type BadgeStatusProps = Pick<
  DiscountCoupon,
  "active" | "expiresAt" | "redeemedCount" | "maxRedemptions"
>;

type StatusKey =
  | "statusActive"
  | "statusInactive"
  | "statusExpired"
  | "statusExhausted";

function deriveStatusKey(props: BadgeStatusProps): StatusKey {
  const { active, expiresAt, redeemedCount, maxRedemptions } = props;
  if (!active) return "statusInactive";
  if (expiresAt && new Date(expiresAt) < new Date()) return "statusExpired";
  if (maxRedemptions !== null && redeemedCount >= maxRedemptions)
    return "statusExhausted";
  return "statusActive";
}

const STATUS_COLOR: Record<
  StatusKey,
  "success" | "default" | "warning" | "danger"
> = {
  statusActive: "success",
  statusInactive: "default",
  statusExpired: "warning",
  statusExhausted: "danger",
};

export function CouponBadgeStatus(props: BadgeStatusProps) {
  const t = useTranslations("coupons");
  const key = deriveStatusKey(props);
  return (
    <Chip
      size="sm"
      color={STATUS_COLOR[key]}
      variant="flat"
      className="capitalize"
    >
      {t(key)}
    </Chip>
  );
}

// ---------------------------------------------------------------------------
// DiscountValueDisplay
// ---------------------------------------------------------------------------
interface DiscountValueProps {
  discountType: DiscountCoupon["discountType"];
  discountValue: number;
}

export function DiscountValueDisplay({
  discountType,
  discountValue,
}: DiscountValueProps) {
  const locale = useLocale();
  if (discountType === "percentage") return <>{discountValue}%</>;
  return (
    <>
      {(discountValue / 100).toLocaleString(locale, {
        style: "currency",
        currency: "BRL",
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// CouponScopeDisplay
// ---------------------------------------------------------------------------
interface CouponScopeProps {
  scope: DiscountCoupon["scope"];
  productIds: string[];
  categoryIds: string[];
}

export function CouponScopeDisplay({
  scope,
  productIds,
  categoryIds,
}: CouponScopeProps) {
  const t = useTranslations("coupons");
  if (scope === "order") return <>{t("scopeOrder")}</>;
  if (scope === "product")
    return <>{t("scopeProduct", { count: productIds.length })}</>;
  return <>{t("scopeCategory", { count: categoryIds.length })}</>;
}

// ---------------------------------------------------------------------------
// RedemptionsDisplay
// ---------------------------------------------------------------------------
interface RedemptionsProps {
  redeemedCount: number;
  maxRedemptions: number | null;
}

export function RedemptionsDisplay({
  redeemedCount,
  maxRedemptions,
}: RedemptionsProps) {
  return (
    <>
      {redeemedCount} / {maxRedemptions === null ? "∞" : maxRedemptions}
    </>
  );
}

// ---------------------------------------------------------------------------
// ExpiresAtDisplay
// ---------------------------------------------------------------------------
export function ExpiresAtDisplay({ expiresAt }: { expiresAt: string | null }) {
  const t = useTranslations("coupons");
  const locale = useLocale();
  if (!expiresAt) return <>{t("noExpiration")}</>;
  return (
    <>
      {new Date(expiresAt).toLocaleDateString(locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// AppliesToBadge
// ---------------------------------------------------------------------------
type AppliesToKey =
  | "appliesToB2B"
  | "appliesToB2C"
  | "appliesToB2CRecurring"
  | "appliesToB2COneTime"
  | "appliesToBoth";

const APPLIES_TO_KEY: Record<DiscountCoupon["appliesTo"], AppliesToKey> = {
  b2b: "appliesToB2B",
  b2c: "appliesToB2C",
  b2c_recurring: "appliesToB2CRecurring",
  b2c_one_time: "appliesToB2COneTime",
  both: "appliesToBoth",
};

export function AppliesToBadge({
  appliesTo,
}: {
  appliesTo: DiscountCoupon["appliesTo"];
}) {
  const t = useTranslations("coupons");
  return (
    <Chip size="sm" color="primary" variant="flat">
      {t(APPLIES_TO_KEY[appliesTo])}
    </Chip>
  );
}

// ---------------------------------------------------------------------------
// ScopeBadge
// ---------------------------------------------------------------------------
const SCOPE_COLOR = {
  order: "default",
  product: "secondary",
  category: "warning",
} as const;

export function ScopeBadge({ scope }: { scope: DiscountCoupon["scope"] }) {
  return (
    <Chip size="sm" color={SCOPE_COLOR[scope]} variant="flat">
      {scope}
    </Chip>
  );
}
