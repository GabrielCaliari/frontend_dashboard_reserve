"use client";

import { Chip } from "@heroui/react";
import type { DiscountCoupon } from "@/src/common/@types/@coupons";

// ---------------------------------------------------------------------------
// CouponBadgeStatus
// ---------------------------------------------------------------------------
type BadgeStatusProps = Pick<
  DiscountCoupon,
  "active" | "expiresAt" | "redeemedCount" | "maxRedemptions"
>;

function deriveStatus(props: BadgeStatusProps) {
  const { active, expiresAt, redeemedCount, maxRedemptions } = props;
  if (!active) return "INATIVO" as const;
  if (expiresAt && new Date(expiresAt) < new Date()) return "EXPIRADO" as const;
  if (maxRedemptions !== null && redeemedCount >= maxRedemptions) return "ESGOTADO" as const;
  return "ATIVO" as const;
}

const STATUS_COLOR = {
  ATIVO: "success",
  INATIVO: "default",
  EXPIRADO: "warning",
  ESGOTADO: "danger",
} as const;

export function CouponBadgeStatus(props: BadgeStatusProps) {
  const status = deriveStatus(props);
  return (
    <Chip size="sm" color={STATUS_COLOR[status]} variant="flat" className="capitalize">
      {status}
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

export function DiscountValueDisplay({ discountType, discountValue }: DiscountValueProps) {
  if (discountType === "PERCENTAGE") return <>{discountValue}%</>;
  return (
    <>
      {(discountValue / 100).toLocaleString("pt-BR", {
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

export function CouponScopeDisplay({ scope, productIds, categoryIds }: CouponScopeProps) {
  if (scope === "ORDER") return <>Todo o pedido</>;
  if (scope === "PRODUCT")
    return <>{productIds.length} {productIds.length === 1 ? "produto" : "produtos"}</>;
  return <>{categoryIds.length} {categoryIds.length === 1 ? "categoria" : "categorias"}</>;
}

// ---------------------------------------------------------------------------
// RedemptionsDisplay
// ---------------------------------------------------------------------------
interface RedemptionsProps {
  redeemedCount: number;
  maxRedemptions: number | null;
}

export function RedemptionsDisplay({ redeemedCount, maxRedemptions }: RedemptionsProps) {
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
  if (!expiresAt) return <>Sem expiração</>;
  return (
    <>
      {new Date(expiresAt).toLocaleDateString("pt-BR", {
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
const APPLIES_LABEL: Record<DiscountCoupon["appliesTo"], string> = {
  b2b: "B2B",
  b2c: "B2C",
  both: "Ambos",
};

export function AppliesToBadge({ appliesTo }: { appliesTo: DiscountCoupon["appliesTo"] }) {
  return (
    <Chip size="sm" color="primary" variant="flat">
      {APPLIES_LABEL[appliesTo]}
    </Chip>
  );
}

// ---------------------------------------------------------------------------
// ScopeBadge
// ---------------------------------------------------------------------------
const SCOPE_COLOR = {
  ORDER: "default",
  PRODUCT: "secondary",
  CATEGORY: "warning",
} as const;

export function ScopeBadge({ scope }: { scope: DiscountCoupon["scope"] }) {
  return (
    <Chip size="sm" color={SCOPE_COLOR[scope]} variant="flat">
      {scope}
    </Chip>
  );
}
