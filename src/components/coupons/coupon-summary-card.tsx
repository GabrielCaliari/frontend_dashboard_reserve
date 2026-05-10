"use client";

import { Progress, Card, CardBody } from "@heroui/react";
import type { DiscountCoupon } from "@/src/common/@types/@coupons";
import {
  CouponBadgeStatus,
  DiscountValueDisplay,
  CouponScopeDisplay,
  AppliesToBadge,
  ExpiresAtDisplay,
} from "./coupon-display";

interface CouponSummaryCardProps {
  coupon: DiscountCoupon;
}

export function CouponSummaryCard({ coupon }: CouponSummaryCardProps) {
  const redemptionPct =
    coupon.maxRedemptions !== null
      ? Math.min((coupon.redeemedCount / coupon.maxRedemptions) * 100, 100)
      : null;

  return (
    <Card className="bg-[#111125] border border-gray-800">
      <CardBody className="p-6 space-y-5">
        {/* Code + Status */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-2xl font-bold text-gray-100 tracking-wide">
              {coupon.code}
            </span>
            <p className="text-sm text-gray-400 mt-0.5">{coupon.name}</p>
          </div>
          <CouponBadgeStatus
            active={coupon.active}
            expiresAt={coupon.expiresAt}
            redeemedCount={coupon.redeemedCount}
            maxRedemptions={coupon.maxRedemptions}
          />
        </div>

        {/* Description */}
        {coupon.description && (
          <p className="text-sm text-gray-400">{coupon.description}</p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Desconto</p>
            <p className="text-gray-100 font-semibold">
              <DiscountValueDisplay
                discountType={coupon.discountType}
                discountValue={coupon.discountValue}
              />
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Escopo</p>
            <p className="text-gray-100 font-semibold">
              <CouponScopeDisplay
                scope={coupon.scope}
                productIds={coupon.productIds}
                categoryIds={coupon.categoryIds}
              />
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Aplica a</p>
            <AppliesToBadge appliesTo={coupon.appliesTo} />
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Expiração</p>
            <p className="text-gray-100">
              <ExpiresAtDisplay expiresAt={coupon.expiresAt} />
            </p>
          </div>
          {coupon.minOrderAmount !== null && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Pedido mínimo</p>
              <p className="text-gray-100">
                {(coupon.minOrderAmount / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </p>
            </div>
          )}
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-0.5">Cumulativo</p>
            <p className="text-gray-100">{coupon.cumulative ? "Sim" : "Não"}</p>
          </div>
        </div>

        {/* Redemption progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Resgates</span>
            <span>
              {coupon.redeemedCount} /{" "}
              {coupon.maxRedemptions === null ? "∞" : coupon.maxRedemptions}
            </span>
          </div>
          {redemptionPct !== null ? (
            <Progress
              value={redemptionPct}
              color={redemptionPct >= 100 ? "danger" : redemptionPct >= 80 ? "warning" : "success"}
              size="sm"
              classNames={{ track: "bg-gray-800" }}
            />
          ) : (
            <p className="text-xs text-gray-600">Sem limite de resgates</p>
          )}
        </div>

        {/* Created / Updated */}
        <div className="flex gap-4 text-xs text-gray-600 pt-1 border-t border-gray-800">
          <span>
            Criado em{" "}
            {new Date(coupon.createdAt).toLocaleDateString("pt-BR")}
          </span>
          <span>
            Atualizado em{" "}
            {new Date(coupon.updatedAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </CardBody>
    </Card>
  );
}
