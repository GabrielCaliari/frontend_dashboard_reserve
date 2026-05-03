"use client";

import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { BillingConfigSection } from "@/src/components/payments/billing-config-section";

export default function PaymentsConfigPage() {
  const t = useTranslations("payments");

  return (
    <LayoutScopeRoot>
      <div className="px-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">{t("billingConfig.title")}</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">{t("billingConfig.subtitle")}</p>
        </div>
        <BillingConfigSection />
      </div>
    </LayoutScopeRoot>
  );
}
