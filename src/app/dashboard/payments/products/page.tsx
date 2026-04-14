"use client";

import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { ProductsTabs } from "@/src/components/payments/products/products-tabs";

export default function PaymentsProductsPage() {
  const t = useTranslations("payments.productsPage");

  return (
    <LayoutScopeRoot>
      <div className="px-6 py-6 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-11">{t("subtitle")}</p>
        </div>

        <ProductsTabs />
      </div>
    </LayoutScopeRoot>
  );
}
