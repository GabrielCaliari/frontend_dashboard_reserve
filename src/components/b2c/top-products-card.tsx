"use client";

import { Card, CardBody, CardHeader, Divider, Skeleton } from "@heroui/react";
import { TrendingUp, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useB2CMetrics } from "@/src/common/hooks/useB2CSubscriptions";

export function TopProductsCard() {
  const { data: metrics, isLoading } = useB2CMetrics();
  const t = useTranslations("payments.b2c");

  return (
    <Card className="h-full">
      <CardHeader className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{t("topProductsTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("topProductsSubtitle")}
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-4 w-12 rounded" />
              </div>
            ))}
          </div>
        ) : metrics?.topProducts && metrics.topProducts.length > 0 ? (
          <div className="space-y-3">
            {metrics.topProducts.map((product, index) => (
              <div
                key={product.productName}
                className="flex items-center justify-between p-3 rounded-lg bg-default-100 dark:bg-default-100/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{product.productName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {product.count}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t("subscriptionsCount")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {t("noTopProducts")}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
