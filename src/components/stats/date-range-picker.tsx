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
    <div className="flex w-full flex-col gap-2 rounded-lg border border-gray-800 bg-[#111125] p-3 sm:w-auto sm:flex-row sm:items-center sm:bg-transparent sm:p-0">
      <div className="flex items-center gap-2 text-gray-400">
        <Calendar className="h-4 w-4 text-gray-400" />
        <span className="text-sm sm:hidden">{t("title")}</span>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="w-full min-w-0 bg-[#16162a] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
        />
        <span className="text-gray-400 text-sm text-center sm:text-left">{t("to")}</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="w-full min-w-0 bg-[#16162a] border border-gray-700 rounded-md px-2 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
        />
      </div>
    </div>
  );
}
