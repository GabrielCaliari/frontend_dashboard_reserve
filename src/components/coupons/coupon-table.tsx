"use client";

import { useState, useCallback } from "react";
import { Spinner, Button, Tooltip, Chip } from "@heroui/react";
import { Pencil, Trash2, Eye, Link2 } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { DiscountCoupon } from "@/src/common/@types/@coupons";
import {
  CouponBadgeStatus,
  DiscountValueDisplay,
  RedemptionsDisplay,
  ExpiresAtDisplay,
  AppliesToBadge,
  ScopeBadge,
} from "./coupon-display";
import { CouponDeactivateModal } from "./coupon-deactivate-modal";
import { CouponLinkModal } from "./coupon-link-modal";

interface CouponTableProps {
  coupons: DiscountCoupon[];
  isLoading: boolean;
}

function CouponCard({
  coupon,
  onDeactivate,
  onCopyLink,
}: {
  coupon: DiscountCoupon;
  onDeactivate: (c: DiscountCoupon) => void;
  onCopyLink: (c: DiscountCoupon) => void;
}) {
  const t = useTranslations("coupons");

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Chip size="sm" variant="flat" className="font-mono text-xs bg-gray-800 text-foreground shrink-0">
          {coupon.code}
        </Chip>
        <CouponBadgeStatus
          active={coupon.active}
          expiresAt={coupon.expiresAt}
          redeemedCount={coupon.redeemedCount}
          maxRedemptions={coupon.maxRedemptions}
        />
      </div>

      <p className="text-sm text-foreground font-medium truncate">{coupon.name}</p>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-muted-foreground uppercase tracking-wider">{t("columnDiscount")}</span>
          <p className="text-foreground mt-0.5">
            <DiscountValueDisplay discountType={coupon.discountType} discountValue={coupon.discountValue} />
          </p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wider">{t("columnScope")}</span>
          <div className="mt-0.5"><ScopeBadge scope={coupon.scope} /></div>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wider">{t("columnAppliesTo")}</span>
          <div className="mt-0.5"><AppliesToBadge appliesTo={coupon.appliesTo} /></div>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wider">{t("columnRedemptions")}</span>
          <p className="text-foreground mt-0.5">
            <RedemptionsDisplay redeemedCount={coupon.redeemedCount} maxRedemptions={coupon.maxRedemptions} />
          </p>
        </div>
        <div>
          <span className="text-muted-foreground uppercase tracking-wider">{t("columnExpiration")}</span>
          <p className="text-foreground mt-0.5"><ExpiresAtDisplay expiresAt={coupon.expiresAt} /></p>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-1 border-t border-border">
        <Button
          as={Link}
          href={`/dashboard/coupons/${coupon.id}`}
          size="sm"
          variant="flat"
          startContent={<Eye className="w-3.5 h-3.5" />}
          className="text-foreground flex-1"
        >
          {t("viewDetails")}
        </Button>
        <Button
          isIconOnly size="sm" variant="light"
          className="text-muted-foreground hover:text-primary"
          onPress={() => onCopyLink(coupon)}
          aria-label={t("copyLink")}
        >
          <Link2 className="w-4 h-4" />
        </Button>
        <Button
          isIconOnly size="sm" variant="light"
          className="text-muted-foreground hover:text-red-400"
          isDisabled={!coupon.active}
          onPress={() => onDeactivate(coupon)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export function CouponTable({ coupons, isLoading }: CouponTableProps) {
  const t = useTranslations("coupons");
  const [deactivating, setDeactivating] = useState<DiscountCoupon | null>(null);
  const [linkCoupon, setLinkCoupon] = useState<DiscountCoupon | null>(null);
  const handleDeactivateClose = useCallback(() => setDeactivating(null), []);
  const handleLinkClose = useCallback(() => setLinkCoupon(null), []);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  }

  if (coupons.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl py-16 text-center">
        <p className="text-muted-foreground text-sm">{t("noCouponsFound")}</p>
      </div>
    );
  }

  const COLUMNS = [
    t("columnCode"), t("columnName"), t("columnDiscount"), t("columnScope"),
    t("columnAppliesTo"), t("columnRedemptions"), t("columnExpiration"),
    t("columnStatus"), t("columnActions"),
  ];

  return (
    <>
      {/* Mobile */}
      <div className="flex flex-col gap-3 lg:hidden">
        {coupons.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} onDeactivate={setDeactivating} onCopyLink={setLinkCoupon} />
        ))}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b border-border">
              {COLUMNS.map((col) => (
                <th key={col} className="px-4 py-3 text-left text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-gray-800">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Chip size="sm" variant="flat" className="font-mono text-xs bg-gray-800 text-foreground">
                    {coupon.code}
                  </Chip>
                </td>
                <td className="px-4 py-3 max-w-[180px] truncate text-foreground">{coupon.name}</td>
                <td className="px-4 py-3 whitespace-nowrap text-foreground">
                  <DiscountValueDisplay discountType={coupon.discountType} discountValue={coupon.discountValue} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap"><ScopeBadge scope={coupon.scope} /></td>
                <td className="px-4 py-3 whitespace-nowrap"><AppliesToBadge appliesTo={coupon.appliesTo} /></td>
                <td className="px-4 py-3 whitespace-nowrap text-foreground">
                  <RedemptionsDisplay redeemedCount={coupon.redeemedCount} maxRedemptions={coupon.maxRedemptions} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-foreground">
                  <ExpiresAtDisplay expiresAt={coupon.expiresAt} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <CouponBadgeStatus
                    active={coupon.active}
                    expiresAt={coupon.expiresAt}
                    redeemedCount={coupon.redeemedCount}
                    maxRedemptions={coupon.maxRedemptions}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <Tooltip content={t("viewDetails")}>
                      <Button as={Link} href={`/dashboard/coupons/${coupon.id}`} isIconOnly size="sm" variant="light" className="text-muted-foreground hover:text-foreground">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t("edit")}>
                      <Button as={Link} href={`/dashboard/coupons/${coupon.id}`} isIconOnly size="sm" variant="light" className="text-muted-foreground hover:text-blue-400">
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t("copyLink")}>
                      <Button isIconOnly size="sm" variant="light" className="text-muted-foreground hover:text-primary" onPress={() => setLinkCoupon(coupon)}>
                        <Link2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t("deactivate")} color="danger">
                      <Button isIconOnly size="sm" variant="light" className="text-muted-foreground hover:text-red-400" isDisabled={!coupon.active} onPress={() => setDeactivating(coupon)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deactivating && (
        <CouponDeactivateModal coupon={deactivating} isOpen={!!deactivating} onClose={handleDeactivateClose} />
      )}

      {linkCoupon && (
        <CouponLinkModal coupon={linkCoupon} isOpen={!!linkCoupon} onClose={handleLinkClose} />
      )}
    </>
  );
}
