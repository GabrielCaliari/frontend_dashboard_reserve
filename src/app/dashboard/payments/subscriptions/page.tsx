"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { SubscriptionsSection } from "@/src/components/payments/subscriptions-section";

export default function PaymentsSubscriptionsPage() {
  const t = useTranslations("payments");

  return (
    <LayoutScopeRoot>
      <div className="px-6 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">{t("subscriptions.title")}</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">{t("subscriptions.manageSubscriptions")}</p>
        </div>
        <SubscriptionsSection />
      </div>
    </LayoutScopeRoot>
  );
}
