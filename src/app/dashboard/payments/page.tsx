"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/react";
import { CreditCard, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { BillingConfigSection } from "@/src/components/payments/billing-config-section";
import { SubscriptionsSection } from "@/src/components/payments/subscriptions-section";

export default function PaymentsPage() {
  const t = useTranslations("payments");
  const [activeTab, setActiveTab] = useState("billing-config");

  return (
    <LayoutScopeRoot>
      <div className="px-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">{t("title")}</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">{t("subtitle")}</p>
        </div>

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          variant="underlined"
          classNames={{
            tabList: "border-b border-[#1f1f2e] w-full",
            cursor: "bg-primary",
            tab: "text-gray-400 data-[selected=true]:text-primary",
          }}
        >
          <Tab
            key="billing-config"
            title={
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>{t("tabBillingConfig")}</span>
              </div>
            }
          >
            <div className="mt-6">
              <BillingConfigSection />
            </div>
          </Tab>
          <Tab
            key="subscriptions"
            title={
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>{t("tabSubscriptions")}</span>
              </div>
            }
          >
            <div className="mt-6">
              <SubscriptionsSection />
            </div>
          </Tab>
        </Tabs>
      </div>
    </LayoutScopeRoot>
  );
}
