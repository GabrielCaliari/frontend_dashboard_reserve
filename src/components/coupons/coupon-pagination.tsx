"use client";

import { Button } from"@heroui/react";
import { ChevronLeft, ChevronRight } from"lucide-react";
import { useTranslations } from"next-intl";

interface CouponPaginationProps {
 page: number;
 total: number;
 limit: number;
 onPageChange: (page: number) => void;
}

export function CouponPagination({ page, total, limit, onPageChange }: CouponPaginationProps) {
 const t = useTranslations("coupons");
 const totalPages = Math.ceil(total / limit);
 const from = (page - 1) * limit + 1;
 const to = Math.min(page * limit, total);

 if (total === 0) return null;

 return (
 <div className="flex items-center justify-between px-1 pt-4">
 <p className="text-sm text-muted-foreground">{t("paginationOf", { from, to, total })}</p>
 <div className="flex items-center gap-2">
 <Button size="sm" variant="flat" isIconOnly isDisabled={page <= 1} onPress={() => onPageChange(page - 1)} className="border-border">
 <ChevronLeft className="w-4 h-4" />
 </Button>
 <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
 <Button size="sm" variant="flat" isIconOnly isDisabled={page >= totalPages} onPress={() => onPageChange(page + 1)} className="border-border">
 <ChevronRight className="w-4 h-4" />
 </Button>
 </div>
 </div>
 );
}
