"use client";

import { useTranslations } from "next-intl";
import { Users } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { B2CSubscriptionsTable } from "@/src/components/b2c/subscriptions-table";
import { B2CMetricsCards } from "@/src/components/b2c/metrics-cards";
import { TopProductsCard } from "@/src/components/b2c/top-products-card";

export default function B2CSubscriptionsPage() {
  const t = useTranslations("payments.b2c");

  return (
    <LayoutScopeRoot>
      <div className="px-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">
              {t("subscriptionsTitle")}
            </h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">
            {t("subscriptionsSubtitle")}
          </p>
        </div>

        <B2CMetricsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <B2CSubscriptionsTable />
          </div>
          <div>
            <TopProductsCard />
          </div>
        </div>
      </div>
    </LayoutScopeRoot>
  );
}
