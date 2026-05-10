"use client";

import { useState, useCallback } from "react";
import {
  Spinner,
  Button,
  Tooltip,
  Chip,
} from "@heroui/react";
import { Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
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

interface CouponTableProps {
  coupons: DiscountCoupon[];
  isLoading: boolean;
}

/** Mobile card for a single coupon row */
function CouponCard({
  coupon,
  onDeactivate,
}: {
  coupon: DiscountCoupon;
  onDeactivate: (c: DiscountCoupon) => void;
}) {
  return (
    <div className="bg-[#111125] border border-gray-800 rounded-xl p-4 space-y-3">
      {/* Code + status */}
      <div className="flex items-start justify-between gap-2">
        <Chip
          size="sm"
          variant="flat"
          className="font-mono text-xs bg-gray-800 text-gray-100 shrink-0"
        >
          {coupon.code}
        </Chip>
        <CouponBadgeStatus
          active={coupon.active}
          expiresAt={coupon.expiresAt}
          redeemedCount={coupon.redeemedCount}
          maxRedemptions={coupon.maxRedemptions}
        />
      </div>

      {/* Name */}
      <p className="text-sm text-gray-200 font-medium truncate">{coupon.name}</p>

      {/* Key facts */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <span className="text-gray-500 uppercase tracking-wider">Desconto</span>
          <p className="text-gray-200 mt-0.5">
            <DiscountValueDisplay
              discountType={coupon.discountType}
              discountValue={coupon.discountValue}
            />
          </p>
        </div>
        <div>
          <span className="text-gray-500 uppercase tracking-wider">Escopo</span>
          <p className="mt-0.5">
            <ScopeBadge scope={coupon.scope} />
          </p>
        </div>
        <div>
          <span className="text-gray-500 uppercase tracking-wider">Aplica a</span>
          <p className="mt-0.5">
            <AppliesToBadge appliesTo={coupon.appliesTo} />
          </p>
        </div>
        <div>
          <span className="text-gray-500 uppercase tracking-wider">Resgates</span>
          <p className="text-gray-200 mt-0.5">
            <RedemptionsDisplay
              redeemedCount={coupon.redeemedCount}
              maxRedemptions={coupon.maxRedemptions}
            />
          </p>
        </div>
        <div>
          <span className="text-gray-500 uppercase tracking-wider">Expiração</span>
          <p className="text-gray-200 mt-0.5">
            <ExpiresAtDisplay expiresAt={coupon.expiresAt} />
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-1 border-t border-gray-800">
        <Button
          as={Link}
          href={`/dashboard/coupons/${coupon.id}`}
          size="sm"
          variant="flat"
          startContent={<Eye className="w-3.5 h-3.5" />}
          className="text-gray-300 flex-1"
        >
          Ver detalhes
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant="light"
          className="text-gray-400 hover:text-red-400"
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
  const [deactivating, setDeactivating] = useState<DiscountCoupon | null>(null);
  const handleDeactivateClose = useCallback(() => setDeactivating(null), []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="bg-[#111125] border border-gray-800 rounded-xl py-16 text-center">
        <p className="text-gray-500 text-sm">Nenhum cupom encontrado.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile: card list ─────────────────────────────── */}
      <div className="flex flex-col gap-3 lg:hidden">
        {coupons.map((coupon) => (
          <CouponCard
            key={coupon.id}
            coupon={coupon}
            onDeactivate={setDeactivating}
          />
        ))}
      </div>

      {/* ── Desktop: horizontal-scrollable table ──────────── */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#111125] border-b border-gray-800">
              {[
                "Código",
                "Nome",
                "Desconto",
                "Escopo",
                "Aplica a",
                "Resgates",
                "Expiração",
                "Status",
                "Ações",
              ].map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs text-gray-400 uppercase tracking-wider whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#111125] divide-y divide-gray-800">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  <Chip
                    size="sm"
                    variant="flat"
                    className="font-mono text-xs bg-gray-800 text-gray-100"
                  >
                    {coupon.code}
                  </Chip>
                </td>
                <td className="px-4 py-3 max-w-[180px] truncate text-gray-200">
                  {coupon.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-200">
                  <DiscountValueDisplay
                    discountType={coupon.discountType}
                    discountValue={coupon.discountValue}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <ScopeBadge scope={coupon.scope} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <AppliesToBadge appliesTo={coupon.appliesTo} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-200">
                  <RedemptionsDisplay
                    redeemedCount={coupon.redeemedCount}
                    maxRedemptions={coupon.maxRedemptions}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-gray-200">
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
                    <Tooltip content="Ver detalhes">
                      <Button
                        as={Link}
                        href={`/dashboard/coupons/${coupon.id}`}
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-gray-400 hover:text-gray-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Editar">
                      <Button
                        as={Link}
                        href={`/dashboard/coupons/${coupon.id}`}
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-gray-400 hover:text-blue-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="Desativar" color="danger">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="text-gray-400 hover:text-red-400"
                        isDisabled={!coupon.active}
                        onPress={() => setDeactivating(coupon)}
                      >
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
        <CouponDeactivateModal
          coupon={deactivating}
          isOpen={!!deactivating}
          onClose={handleDeactivateClose}
        />
      )}
    </>
  );
}
