"use client";

import { useState, useMemo } from "react";
import { Tag } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { useListCoupons } from "@/src/common/hooks/useCoupons";
import { CouponTable } from "@/src/components/coupons/coupon-table";
import { CouponFiltersBar } from "@/src/components/coupons/coupon-filters-bar";
import { CouponPagination } from "@/src/components/coupons/coupon-pagination";
import type {
  ECouponScope,
  ECouponAppliesTo,
} from "@/src/common/@types/@coupons";

const PAGE_SIZE = 50;

export default function CouponsListPage() {
  const t = useTranslations("coupons");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [scopeFilter, setScopeFilter] = useState<ECouponScope | "all">("all");
  const [appliesToFilter, setAppliesToFilter] = useState<
    ECouponAppliesTo | "all"
  >("all");

  const { data, isLoading } = useListCoupons({ page, limit: PAGE_SIZE });

  const filtered = useMemo(() => {
    const coupons = data?.data ?? [];
    return coupons.filter((c) => {
      const matchSearch =
        !search ||
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase());

      const matchActive =
        activeFilter === "all" ||
        (activeFilter === "active" && c.active) ||
        (activeFilter === "inactive" && !c.active);

      const matchScope = scopeFilter === "all" || c.scope === scopeFilter;

      const matchAppliesTo =
        appliesToFilter === "all" || c.appliesTo === appliesToFilter;

      return matchSearch && matchActive && matchScope && matchAppliesTo;
    });
  }, [data?.data, search, activeFilter, scopeFilter, appliesToFilter]);

  function handleSearchChange(v: string) {
    setSearch(v);
    setPage(1);
  }
  function handleActiveFilterChange(v: "all" | "active" | "inactive") {
    setActiveFilter(v);
    setPage(1);
  }
  function handleScopeFilterChange(v: ECouponScope | "all") {
    setScopeFilter(v);
    setPage(1);
  }
  function handleAppliesToFilterChange(v: ECouponAppliesTo | "all") {
    setAppliesToFilter(v);
    setPage(1);
  }

  return (
    <LayoutScopeRoot>
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tag className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              {t("pageTitle")}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">
            {t("pageSubtitle")}
          </p>
        </div>

        <div className="space-y-4">
          <CouponFiltersBar
            search={search}
            onSearchChange={handleSearchChange}
            activeFilter={activeFilter}
            onActiveFilterChange={handleActiveFilterChange}
            scopeFilter={scopeFilter}
            onScopeFilterChange={handleScopeFilterChange}
            appliesToFilter={appliesToFilter}
            onAppliesToFilterChange={handleAppliesToFilterChange}
          />

          <Card className="bg-transparent border-0 p-0">
            <CardBody className="p-0">
              <CouponTable coupons={filtered} isLoading={isLoading} />
            </CardBody>
          </Card>

          <CouponPagination
            page={page}
            total={data?.meta?.total ?? 0}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
