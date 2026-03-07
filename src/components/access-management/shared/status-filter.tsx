"use client";

import { useTranslations } from "next-intl";
import { Button } from "@nextui-org/react";

export type StatusFilter = "all" | "active" | "inactive";

interface StatusFilterProps {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
}

export function StatusFilterControl({ value, onChange }: StatusFilterProps) {
  const t = useTranslations("accessManagement.statusFilter");

  const options: { key: StatusFilter; label: string }[] = [
    { key: "all",      label: t("all")      },
    { key: "active",   label: t("active")   },
    { key: "inactive", label: t("inactive") },
  ];

  return (
    <div className="flex gap-1 p-1 bg-content2 rounded-lg border border-divider">
      {options.map((opt) => (
        <Button
          key={opt.key}
          size="sm"
          variant={value === opt.key ? "solid" : "light"}
          color={value === opt.key ? "primary" : "default"}
          onPress={() => onChange(opt.key)}
          className="min-w-[70px]"
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
