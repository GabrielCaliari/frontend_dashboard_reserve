"use client";

import { Input, Button, Select, SelectItem } from "@heroui/react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import type { ECouponScope, ECouponAppliesTo } from "@/src/common/@types/@coupons";

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
  const triggerClass = "bg-[#0d0d20] border-gray-700 min-w-[140px]";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Left: search + filters */}
      <div className="flex flex-wrap items-center gap-3 flex-1">
        <Input
          placeholder="Buscar por código ou nome…"
          value={search}
          onValueChange={onSearchChange}
          startContent={<Search className="w-4 h-4 text-gray-500" />}
          classNames={{
            inputWrapper: "bg-[#0d0d20] border-gray-700 min-w-[200px]",
            input: "text-gray-100",
          }}
          isClearable
          onClear={() => onSearchChange("")}
        />

        <Select
          aria-label="Filtrar por status"
          selectedKeys={new Set([activeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as "all" | "active" | "inactive";
            onActiveFilterChange(val);
          }}
          classNames={{ trigger: triggerClass }}
        >
          <SelectItem key="all">Todos os status</SelectItem>
          <SelectItem key="active">Ativos</SelectItem>
          <SelectItem key="inactive">Inativos</SelectItem>
        </Select>

        <Select
          aria-label="Filtrar por escopo"
          selectedKeys={new Set([scopeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponScope | "all";
            onScopeFilterChange(val);
          }}
          classNames={{ trigger: triggerClass }}
        >
          <SelectItem key="all">Todos os escopos</SelectItem>
          <SelectItem key="ORDER">Pedido</SelectItem>
          <SelectItem key="PRODUCT">Produto</SelectItem>
          <SelectItem key="CATEGORY">Categoria</SelectItem>
        </Select>

        <Select
          aria-label="Filtrar por aplicação"
          selectedKeys={new Set([appliesToFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponAppliesTo | "all";
            onAppliesToFilterChange(val);
          }}
          classNames={{ trigger: triggerClass }}
        >
          <SelectItem key="all">B2B + B2C</SelectItem>
          <SelectItem key="b2b">Apenas B2B</SelectItem>
          <SelectItem key="b2c">Apenas B2C</SelectItem>
          <SelectItem key="both">Ambos</SelectItem>
        </Select>
      </div>

      {/* Right: CTA */}
      <Button
        as={Link}
        href="/dashboard/coupons/new"
        color="primary"
        startContent={<Plus className="w-4 h-4" />}
        className="shrink-0"
      >
        Novo Cupom
      </Button>
    </div>
  );
}
