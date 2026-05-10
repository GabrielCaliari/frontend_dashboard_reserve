"use client";

import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CouponPaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function CouponPagination({
  page,
  total,
  limit,
  onPageChange,
}: CouponPaginationProps) {
  const totalPages = Math.ceil(total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-1 pt-4">
      <p className="text-sm text-gray-500">
        {from}–{to} de {total} cupons
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          isDisabled={page <= 1}
          onPress={() => onPageChange(page - 1)}
          className="border-gray-700"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-400">
          {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="flat"
          isIconOnly
          isDisabled={page >= totalPages}
          onPress={() => onPageChange(page + 1)}
          className="border-gray-700"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
