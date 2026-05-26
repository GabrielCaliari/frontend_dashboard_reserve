"use client";

import { Progress, Card, CardBody } from "@heroui/react";
import { useTranslations, useLocale } from "next-intl";
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
  const t = useTranslations("coupons");
  const locale = useLocale();

  const redemptionPct =
    coupon.maxRedemptions !== null
      ? Math.min((coupon.redeemedCount / coupon.maxRedemptions) * 100, 100)
      : null;

  return (
    <Card className="bg-card border border-border">
      <CardBody className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-2xl font-bold text-foreground tracking-wide">{coupon.code}</span>
            <p className="text-sm text-muted-foreground mt-0.5">{coupon.name}</p>
          </div>
          <CouponBadgeStatus
            active={coupon.active}
            expiresAt={coupon.expiresAt}
            redeemedCount={coupon.redeemedCount}
            maxRedemptions={coupon.maxRedemptions}
          />
        </div>

        {coupon.description && <p className="text-sm text-muted-foreground">{coupon.description}</p>}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryDiscount")}</p>
            <p className="text-foreground font-semibold">
              <DiscountValueDisplay discountType={coupon.discountType} discountValue={coupon.discountValue} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryScope")}</p>
            <p className="text-foreground font-semibold">
              <CouponScopeDisplay scope={coupon.scope} productIds={coupon.productIds} categoryIds={coupon.categoryIds} />
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryAppliesTo")}</p>
            <AppliesToBadge appliesTo={coupon.appliesTo} />
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryExpiration")}</p>
            <p className="text-foreground"><ExpiresAtDisplay expiresAt={coupon.expiresAt} /></p>
          </div>
          {coupon.minOrderAmount !== null && (
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryMinOrder")}</p>
              <p className="text-foreground">
                {(coupon.minOrderAmount / 100).toLocaleString(locale, { style: "currency", currency: "BRL" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">{t("summaryCumulative")}</p>
            <p className="text-foreground">{coupon.cumulative ? t("summaryCumulativeYes") : t("summaryCumulativeNo")}</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{t("summaryRedemptions")}</span>
            <span>{coupon.redeemedCount} / {coupon.maxRedemptions === null ? "∞" : coupon.maxRedemptions}</span>
          </div>
          {redemptionPct !== null ? (
            <Progress
              value={redemptionPct}
              color={redemptionPct >= 100 ? "danger" : redemptionPct >= 80 ? "warning" : "success"}
              size="sm"
              classNames={{ track: "bg-gray-800" }}
            />
          ) : (
            <p className="text-xs text-gray-600">{t("summaryNoLimit")}</p>
          )}
        </div>

        <div className="flex gap-4 text-xs text-gray-600 pt-1 border-t border-border">
          <span>{t("summaryCreatedAt", { date: new Date(coupon.createdAt).toLocaleDateString(locale) })}</span>
          <span>{t("summaryUpdatedAt", { date: new Date(coupon.updatedAt).toLocaleDateString(locale) })}</span>
        </div>
      </CardBody>
    </Card>
  );
}
