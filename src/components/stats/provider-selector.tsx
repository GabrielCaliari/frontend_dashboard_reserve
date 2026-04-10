"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AvailableIntegration } from "@/src/shared/domain/types/@stats";

interface ProviderSelectorProps {
  providers: AvailableIntegration[];
  selectedKey: string | null;
  onSelect: (provider: AvailableIntegration) => void;
}

export function ProviderSelector({
  providers,
  selectedKey,
  onSelect,
}: ProviderSelectorProps) {
  const t = useTranslations("stats.integrations");

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">
        {t("selectProvider")}
      </p>
      <div className="grid grid-cols-1 gap-2">
        {providers.map((provider) => {
          const isSelected = selectedKey === provider.key;
          return (
            <button
              key={provider.key}
              type="button"
              onClick={() => onSelect(provider)}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-border"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {provider.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {provider.description}
                </p>
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
