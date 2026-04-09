"use client";

import { Input, Button, Select, SelectItem } from "@heroui/react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type {
  ECouponScope,
  ECouponAppliesTo,
} from "@/src/common/@types/@coupons";

interface CouponFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  activeFilter: "all" | "active" | "inactive";
  onActiveFilterChange: (value: "all" | "active" | "inactive") => void;
  scopeFilter: ECouponScope | "all";
  onScopeFilterChange: (value: ECouponScope | "all") => void;
  appliesToFilter: ECouponAppliesTo | "all";
  onAppliesToFilterChange: (value: ECouponAppliesTo | "all") => void;
}

export function CouponFiltersBar({
  search,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
  scopeFilter,
  onScopeFilterChange,
  appliesToFilter,
  onAppliesToFilterChange,
}: CouponFiltersBarProps) {
  const t = useTranslations("coupons");
  const selectClass = "bg-[#0d0d20] border-border";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[180px]">
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onValueChange={onSearchChange}
          startContent={
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          }
          classNames={{
            inputWrapper: "bg-[#0d0d20] border-border",
            input: "text-foreground",
          }}
          isClearable
          onClear={() => onSearchChange("")}
        />
      </div>

      <div className="w-[150px] shrink-0">
        <Select
          aria-label={t("filterAllStatuses")}
          selectedKeys={new Set([activeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as "all" | "active" | "inactive";
            onActiveFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">{t("filterAllStatuses")}</SelectItem>
          <SelectItem key="active">{t("filterActive")}</SelectItem>
          <SelectItem key="inactive">{t("filterInactive")}</SelectItem>
        </Select>
      </div>

      <div className="w-[160px] shrink-0">
        <Select
          aria-label={t("filterAllScopes")}
          selectedKeys={new Set([scopeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponScope | "all";
            onScopeFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">{t("filterAllScopes")}</SelectItem>
          <SelectItem key="order">{t("scopeFilterOrder")}</SelectItem>
          <SelectItem key="product">{t("scopeFilterProduct")}</SelectItem>
          <SelectItem key="category">{t("scopeFilterCategory")}</SelectItem>
        </Select>
      </div>

      <div className="w-[200px] shrink-0">
        <Select
          aria-label={t("filterAllApplications")}
          selectedKeys={new Set([appliesToFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponAppliesTo | "all";
            onAppliesToFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">{t("filterAllApplications")}</SelectItem>
          <SelectItem key="b2b">{t("appliesToFilterB2B")}</SelectItem>
          <SelectItem key="b2c">{t("appliesToFilterB2C")}</SelectItem>
          <SelectItem key="b2c_recurring">
            {t("appliesToFilterB2CRecurring")}
          </SelectItem>
          <SelectItem key="b2c_one_time">
            {t("appliesToFilterB2COneTime")}
          </SelectItem>
          <SelectItem key="both">{t("appliesToFilterBoth")}</SelectItem>
        </Select>
      </div>

      <Button
        as={Link}
        href="/dashboard/coupons/new"
        color="primary"
        startContent={<Plus className="w-4 h-4" />}
        className="shrink-0 ml-auto"
      >
        {t("newCouponBtn")}
      </Button>
    </div>
  );
}
