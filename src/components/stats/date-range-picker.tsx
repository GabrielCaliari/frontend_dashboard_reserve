"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onChange }: DateRangePickerProps) {
  const t = useTranslations("stats");

  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-400" />
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="bg-[#16162a] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <span className="text-gray-400 text-sm">{t("to")}</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="bg-[#16162a] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}
