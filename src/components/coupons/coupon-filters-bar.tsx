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
  const selectClass = "bg-[#0d0d20] border-gray-700";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="flex-1 min-w-[180px]">
        <Input
          placeholder="Buscar por código ou nome…"
          value={search}
          onValueChange={onSearchChange}
          startContent={<Search className="w-4 h-4 text-gray-500 shrink-0" />}
          classNames={{
            inputWrapper: "bg-[#0d0d20] border-gray-700",
            input: "text-gray-100",
          }}
          isClearable
          onClear={() => onSearchChange("")}
        />
      </div>

      {/* Status */}
      <div className="w-[150px] shrink-0">
        <Select
          aria-label="Filtrar por status"
          selectedKeys={new Set([activeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as "all" | "active" | "inactive";
            onActiveFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">Todos status</SelectItem>
          <SelectItem key="active">Ativos</SelectItem>
          <SelectItem key="inactive">Inativos</SelectItem>
        </Select>
      </div>

      {/* Scope */}
      <div className="w-[160px] shrink-0">
        <Select
          aria-label="Filtrar por escopo"
          selectedKeys={new Set([scopeFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponScope | "all";
            onScopeFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">Todos escopos</SelectItem>
          <SelectItem key="order">Pedido</SelectItem>
          <SelectItem key="product">Produto</SelectItem>
          <SelectItem key="category">Categoria</SelectItem>
        </Select>
      </div>

      {/* Applies to */}
      <div className="w-[150px] shrink-0">
        <Select
          aria-label="Filtrar por aplicação"
          selectedKeys={new Set([appliesToFilter])}
          onSelectionChange={(keys) => {
            const val = Array.from(keys)[0] as ECouponAppliesTo | "all";
            onAppliesToFilterChange(val);
          }}
          classNames={{ trigger: selectClass }}
        >
          <SelectItem key="all">B2B + B2C</SelectItem>
          <SelectItem key="b2b">Apenas B2B</SelectItem>
          <SelectItem key="b2c">Apenas B2C</SelectItem>
          <SelectItem key="both">Ambos</SelectItem>
        </Select>
      </div>

      {/* CTA */}
      <Button
        as={Link}
        href="/dashboard/coupons/new"
        color="primary"
        startContent={<Plus className="w-4 h-4" />}
        className="shrink-0 ml-auto"
      >
        Novo Cupom
      </Button>
    </div>
  );
}
