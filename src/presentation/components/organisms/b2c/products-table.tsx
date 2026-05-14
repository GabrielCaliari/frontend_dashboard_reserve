"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Spinner,
} from "@heroui/react";
import { ExternalLink, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/src/shared/domain/types/@b2c-products";

interface ProductsTableProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductsTable({ products, isLoading }: ProductsTableProps) {
  const t = useTranslations("payments.b2c");

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatInterval = (interval: string, count: number) => {
    const intervalKey =
      `per${interval.charAt(0).toUpperCase() + interval.slice(1)}` as
        | "perMonth"
        | "perYear"
        | "perWeek"
        | "perDay";
    const intervalText = t(intervalKey);
    return count > 1 ? `${count} ${intervalText}s` : intervalText;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {t("noProducts")}
      </div>
    );
  }

  return (
    <Table aria-label={t("productsTitle")}>
      <TableHeader>
        <TableColumn>{t("columnName").toUpperCase()}</TableColumn>
        <TableColumn>{t("columnSlug").toUpperCase()}</TableColumn>
        <TableColumn>{t("columnStatus").toUpperCase()}</TableColumn>
        <TableColumn>{t("columnPrices").toUpperCase()}</TableColumn>
        <TableColumn>{t("columnActions").toUpperCase()}</TableColumn>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div>
                <div className="font-semibold">{product.name}</div>
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {product.description}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <code className="text-xs bg-default-100 dark:bg-default-100 px-2 py-1 rounded">
                {product.slug}
              </code>
            </TableCell>
            <TableCell>
              <Chip
                color={product.active ? "success" : "default"}
                variant="flat"
                size="sm"
              >
                {product.active ? t("statusActive") : t("statusInactive")}
              </Chip>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                {product.prices.map((price) => (
                  <div
                    key={price.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <DollarSign className="w-3 h-3" />
                    <span className="font-medium">
                      {formatPrice(price.unitAmount, price.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      / {formatInterval(price.interval, price.intervalCount)}
                    </span>
                    {!price.active && (
                      <Chip size="sm" variant="flat" color="warning">
                        {t("statusInactive")}
                      </Chip>
                    )}
                  </div>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="light"
                startContent={<ExternalLink className="w-4 h-4" />}
                onPress={() =>
                  window.open(
                    `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                    "_blank",
                  )
                }
              >
                {t("viewOnStripe")}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
