"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { PlansSection } from "@/src/components/payments/plans-section";
import { B2CProductsSection } from "@/src/components/b2c/b2c-products-section";
import { B2BProductsSection } from "@/src/components/b2b/b2b-products-section";

export default function PaymentsProductsPage() {
  const t = useTranslations("payments");

  return (
    <LayoutScopeRoot>
      <div className="px-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-gray-100">{t("products.title")}</h1>
          </div>
          <p className="text-sm text-gray-400 ml-11">{t("products.subtitle")}</p>
        </div>
        
        <B2BProductsSection />
        
        <B2CProductsSection />
        
        <PlansSection />
      </div>
    </LayoutScopeRoot>
  );
}
