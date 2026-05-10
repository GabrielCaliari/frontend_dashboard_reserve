"use client";

import { useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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

  return (
    <>
      <Table
        aria-label="Tabela de cupons"
        classNames={{
          wrapper: "bg-[#111125] border border-gray-800 rounded-xl",
          th: "bg-transparent text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800",
          td: "text-gray-200 py-3",
        }}
      >
        <TableHeader>
          <TableColumn>Código</TableColumn>
          <TableColumn>Nome</TableColumn>
          <TableColumn>Desconto</TableColumn>
          <TableColumn>Escopo</TableColumn>
          <TableColumn>Aplica a</TableColumn>
          <TableColumn>Resgates</TableColumn>
          <TableColumn>Expiração</TableColumn>
          <TableColumn>Status</TableColumn>
          <TableColumn>Ações</TableColumn>
        </TableHeader>
        <TableBody emptyContent="Nenhum cupom encontrado.">
          {coupons.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell>
                <Chip
                  size="sm"
                  variant="flat"
                  className="font-mono text-xs bg-gray-800 text-gray-100"
                >
                  {coupon.code}
                </Chip>
              </TableCell>
              <TableCell className="max-w-[180px] truncate">{coupon.name}</TableCell>
              <TableCell>
                <DiscountValueDisplay
                  discountType={coupon.discountType}
                  discountValue={coupon.discountValue}
                />
              </TableCell>
              <TableCell>
                <ScopeBadge scope={coupon.scope} />
              </TableCell>
              <TableCell>
                <AppliesToBadge appliesTo={coupon.appliesTo} />
              </TableCell>
              <TableCell>
                <RedemptionsDisplay
                  redeemedCount={coupon.redeemedCount}
                  maxRedemptions={coupon.maxRedemptions}
                />
              </TableCell>
              <TableCell>
                <ExpiresAtDisplay expiresAt={coupon.expiresAt} />
              </TableCell>
              <TableCell>
                <CouponBadgeStatus
                  active={coupon.active}
                  expiresAt={coupon.expiresAt}
                  redeemedCount={coupon.redeemedCount}
                  maxRedemptions={coupon.maxRedemptions}
                />
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
