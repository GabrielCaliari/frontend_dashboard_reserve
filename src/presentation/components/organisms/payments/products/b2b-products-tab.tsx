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
  Skeleton,
  Tooltip,
  Select,
  SelectItem,
} from "@heroui/react";
import {
  ExternalLink,
  DollarSign,
  FileX,
  Copy,
  Check,
  Link,
  Settings,
  Tags,
  Sliders,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { useListB2BProducts } from "@/src/shared/hooks/b2b-payments/use-b2b-payments";
import { useCategories } from "@/src/common/hooks/payments/use-b2c-fees";
import type { B2BProduct } from "@/src/shared/domain/types/@b2b-payments";
import { GenerateCheckoutLinkModal } from "./generate-checkout-link-modal";
import { B2BGlobalFeesModal } from "./b2b-global-fees-modal";
import { CategoriesModal } from "./categories-modal";
import { B2BProductFeesModal } from "./b2b-product-fees-modal";
import { B2BEffectiveFeeCell, B2BFinalPriceCell } from "./effective-fee-cell";

interface B2BProductsTabProps {
  refreshKey?: number;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("payments.productsPage");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const el = document.createElement("textarea");
        el.value = value;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
    [value],
  );

  return (
    <div className="flex items-center gap-1.5 group">
      <code className="text-xs font-mono text-foreground truncate max-w-[160px]">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? t("copied") : label}
        className="flex-shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground transition-colors" />
        )}
      </button>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function B2BProductsTab({
  refreshKey: _refreshKey,
}: B2BProductsTabProps) {
  const t = useTranslations("payments.productsPage");
  const { data: products, isLoading, error } = useListB2BProducts();
  const { data: categories = [] } = useCategories();

  const [linkProduct, setLinkProduct] = useState<B2BProduct | null>(null);
  const [feesProduct, setFeesProduct] = useState<B2BProduct | null>(null);
  const [isGlobalFeesOpen, setIsGlobalFeesOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const filteredProducts = ((products as B2BProduct[]) ?? []).filter((p) => {
    if (categoryFilter === "all") return true;
    if (categoryFilter === "none") return !p.categoryId;
    return p.categoryId === categoryFilter;
  });

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center text-red-400 text-sm">
        {t("errorLoading")}:{" "}
        {error instanceof Error ? error.message : t("errorUnknown")}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <FileX className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">{t("noB2BProducts")}</p>
        <p className="text-xs text-muted-foreground">
          {t("noB2BProductsDesc")}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar — compartilhado com B2C */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button
          size="sm"
          variant="flat"
          startContent={<Settings className="w-3.5 h-3.5" />}
          onPress={() => setIsGlobalFeesOpen(true)}
        >
          {t("feesGlobalBtn")}
        </Button>
        <Button
          size="sm"
          variant="flat"
          startContent={<Tags className="w-3.5 h-3.5" />}
          onPress={() => setIsCategoriesOpen(true)}
        >
          {t("feesCategoriesBtn")}
          {categories.length > 0 && (
            <Chip size="sm" variant="flat" className="ml-1 h-4 text-[10px]">
              {categories.length}
            </Chip>
          )}
        </Button>

        {/* Filtro de categoria */}
        {categories.length > 0 && (
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[categoryFilter]}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t("filterByCategory")}
            className="w-48"
            classNames={{
              trigger: "border-border bg-default-100/50 h-8 min-h-8",
            }}
          >
            <SelectItem key="all">{t("filterAllCategories")}</SelectItem>
            <SelectItem key="none">{t("filterNoCategory")}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id}>{cat.name}</SelectItem>
            ))}
          </Select>
        )}
      </div>

      <Table
        aria-label={t("tabOneTime")}
        classNames={{
          wrapper: "rounded-xl border border-border",
          th: "bg-default-100 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
          tr: "hover:bg-default-100/50 transition-colors",
        }}
      >
        <TableHeader>
          <TableColumn>{t("columnName").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnCategory").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnEffectiveFees").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnStatus").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnPrice").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnFinalPrice").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnStripeIds").toUpperCase()}</TableColumn>
          <TableColumn>{t("columnActions").toUpperCase()}</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => {
            const categoryName = product.categoryId
              ? categoryMap[product.categoryId]
              : null;

            return (
              <TableRow key={product.id}>
                {/* Nome */}
                <TableCell>
                  <div>
                    <p className="font-semibold text-foreground">
                      {product.name}
                    </p>
                    <code className="text-xs text-muted-foreground font-mono">
                      {product.slug}
                    </code>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {product.description}
                      </p>
                    )}
                  </div>
                </TableCell>

                {/* Categoria */}
                <TableCell>
                  {categoryName ? (
                    <Chip size="sm" variant="flat" color="secondary">
                      {categoryName}
                    </Chip>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      —
                    </span>
                  )}
                </TableCell>

                {/* Taxas efetivas via calculate-cost */}
                <TableCell>
                  <B2BEffectiveFeeCell productId={product.id} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    color={product.active ? "success" : "default"}
                    variant="flat"
                    size="sm"
                  >
                    {product.active ? t("statusActive") : t("statusInactive")}
                  </Chip>
                </TableCell>

                {/* Preço base */}
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t("oneTimeLabel")}
                    </span>
                  </div>
                </TableCell>

                {/* Preço final com taxas */}
                <TableCell>
                  <B2BFinalPriceCell productId={product.id} />
                </TableCell>

                {/* Stripe IDs */}
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16 flex-shrink-0 whitespace-nowrap">
                        {t("stripeProductId")}
                      </span>
                      {product.stripeProductId ? (
                        <CopyButton
                          value={product.stripeProductId}
                          label={t("copyProductId")}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16 flex-shrink-0 whitespace-nowrap">
                        {t("stripePriceId")}
                      </span>
                      {product.stripePriceId ? (
                        <CopyButton
                          value={product.stripePriceId}
                          label={t("copyPriceId")}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Ações */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip content={t("feesConfigureBtn")}>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => setFeesProduct(product)}
                        aria-label={t("feesConfigureBtn")}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t("generateLink")}>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        isIconOnly
                        onPress={() => setLinkProduct(product)}
                        aria-label={t("generateLink")}
                      >
                        <Link className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t("viewOnStripe")}>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() =>
                          window.open(
                            `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                            "_blank",
                          )
                        }
                        aria-label={t("viewOnStripe")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Modals compartilhados com B2C */}
      <B2BGlobalFeesModal
        isOpen={isGlobalFeesOpen}
        onClose={() => setIsGlobalFeesOpen(false)}
      />
      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
      />

      <B2BProductFeesModal
        isOpen={!!feesProduct}
        onClose={() => setFeesProduct(null)}
        product={feesProduct}
      />

      <GenerateCheckoutLinkModal
        isOpen={!!linkProduct}
        onClose={() => setLinkProduct(null)}
        product={linkProduct}
      />
    </>
  );
}
