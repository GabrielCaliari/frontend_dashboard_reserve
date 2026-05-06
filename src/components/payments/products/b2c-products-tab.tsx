'use client';

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
} from '@heroui/react';
import {
  ExternalLink,
  DollarSign,
  FileX,
  Copy,
  Check,
  Link as LinkIcon,
  Settings,
  Tags,
  Sliders,
  Percent,
  Truck,
  Package,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import { useListB2CProducts } from '@/src/common/hooks/useB2CProducts';
import { useCategories } from '@/src/common/hooks/payments/use-b2c-fees';
import { GenerateB2CCheckoutLinkModal } from './generate-b2c-checkout-link-modal';
import { GlobalFeesModal } from './global-fees-modal';
import { CategoriesModal } from './categories-modal';
import { ProductFeesModal } from './product-fees-modal';
import { B2CEffectiveFeeCell, B2CFinalPriceCell } from './effective-fee-cell';
import type { Product } from '@/src/common/@types/@b2c-products';

interface B2CProductsTabProps {
  refreshKey?: number;
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const el = document.createElement('textarea');
      el.value = value;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <div className="flex items-center gap-1.5 group">
      <code className="text-xs font-mono text-gray-300 truncate max-w-[160px]">{value}</code>
      <button type="button" onClick={handleCopy} aria-label={label} className="flex-shrink-0">
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-gray-500 hover:text-gray-200 transition-colors" />
        )}
      </button>
    </div>
  );
}

// ─── Fee badge ────────────────────────────────────────────────────────────────

function FeeBadge({ value, label, icon: Icon, color }: {
  value: string | null;
  label: string;
  icon: React.ElementType;
  color: string;
}) {
  if (!value) return <span className="text-xs text-gray-600 italic">—</span>;
  return (
    <Tooltip content={label}>
      <div className={`flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon className="w-3 h-3" />
        {value}
      </div>
    </Tooltip>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function B2CProductsTab({ refreshKey: _refreshKey }: B2CProductsTabProps) {
  const t = useTranslations('payments.productsPage');
  const { data: products, isLoading, error } = useListB2CProducts();
  const { data: categories = [] } = useCategories();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isGenerateLinkOpen, setIsGenerateLinkOpen] = useState(false);
  const [isGlobalFeesOpen, setIsGlobalFeesOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isProductFeesOpen, setIsProductFeesOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const filteredProducts = (products ?? []).filter((p) => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'none') return !p.categoryId;
    return p.categoryId === categoryFilter;
  });

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);

  const formatInterval = (interval: string, count: number) => {
    const labelMap: Record<string, string> = {
      month: t('intervalMonth'),
      year: t('intervalYear'),
      week: t('intervalWeek'),
      day: t('intervalDay'),
    };
    const label = labelMap[interval] ?? interval;
    return count > 1 ? t('intervalEvery', { count: `${count} ${label.toLowerCase()}s` }) : label;
  };

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
    const errorMessage = error instanceof Error ? error.message : t('errorUnknown');
    return (
      <div className="py-10 px-6">
        <div className="max-w-2xl mx-auto bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <FileX className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-300 mb-1">{t('errorLoading')}</h3>
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
        <FileX className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">{t('noB2CProducts')}</p>
        <p className="text-xs text-gray-600">{t('noB2CProductsDesc')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Button size="sm" variant="flat" startContent={<Settings className="w-3.5 h-3.5" />} onPress={() => setIsGlobalFeesOpen(true)}>
          {t('feesGlobalBtn')}
        </Button>
        <Button size="sm" variant="flat" startContent={<Tags className="w-3.5 h-3.5" />} onPress={() => setIsCategoriesOpen(true)}>
          {t('feesCategoriesBtn')}
          {categories.length > 0 && <Chip size="sm" variant="flat" className="ml-1 h-4 text-[10px]">{categories.length}</Chip>}
        </Button>

        {/* Filtro de categoria */}
        {categories.length > 0 && (
          <Select
            size="sm"
            variant="bordered"
            selectedKeys={[categoryFilter]}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label={t('filterByCategory')}
            className="w-48"
            classNames={{ trigger: 'border-gray-700 bg-gray-900/50 h-8 min-h-8' }}
          >
            <SelectItem key="all">{t('filterAllCategories')}</SelectItem>
            <SelectItem key="none">{t('filterNoCategory')}</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id}>{cat.name}</SelectItem>
            ))}
          </Select>
        )}
      </div>

      <Table
        aria-label={t('tabRecurring')}
        classNames={{
          wrapper: 'rounded-xl border border-[#1f1f2e]',
          th: 'bg-[#1a1a2e] text-xs font-semibold uppercase tracking-wider text-gray-400',
          tr: 'hover:bg-[#1a1a2e]/50 transition-colors',
        }}
      >
        <TableHeader>
          <TableColumn>{t('columnName').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnCategory').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnEffectiveFees').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnPrices').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnFinalPrice').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnStripeIds').toUpperCase()}</TableColumn>
          <TableColumn>{t('columnActions').toUpperCase()}</TableColumn>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => {
            const chipDisplay = product.chipCostOverride != null
              ? `${product.chipCostOverride}%`
              : null;
            const shippingDisplay = product.shippingFeeOverride != null
              ? `R$${(product.shippingFeeOverride / 100).toFixed(2)}`
              : null;
            const categoryName = product.categoryId ? categoryMap[product.categoryId] : null;

            return (
              <TableRow key={product.id}>
                {/* Nome */}
                <TableCell>
                  <div>
                    <p className="font-semibold text-gray-100">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
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
                    <span className="text-xs text-gray-600 italic">—</span>
                  )}
                </TableCell>

                {/* Taxas efetivas via calculate-cost */}
                <TableCell>
                  <B2CEffectiveFeeCell productId={product.id} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Chip color={product.active ? 'success' : 'default'} variant="flat" size="sm">
                    {product.active ? t('statusActive') : t('statusInactive')}
                  </Chip>
                </TableCell>

                {/* Preços */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {product.prices.length === 0 && (
                      <span className="text-xs text-gray-500">{t('noPrices')}</span>
                    )}
                    {product.prices.map((price) => (
                      <div key={price.id} className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-100">
                          {formatPrice(price.unitAmount, price.currency)}
                        </span>
                        <span className="text-xs text-gray-500">
                          / {formatInterval(price.interval, price.intervalCount)}
                        </span>
                        {!price.active && (
                          <Chip size="sm" variant="flat" color="warning" className="text-xs">
                            {t('statusInactive')}
                          </Chip>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>

                {/* Preço final com taxas */}
                <TableCell>
                  <B2CFinalPriceCell productId={product.id} />
                </TableCell>

                {/* Stripe IDs */}
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-16 flex-shrink-0 whitespace-nowrap">
                        {t('stripeProductId')}
                      </span>
                      {product.stripeProductId ? (
                        <CopyButton value={product.stripeProductId} label={t('copyProductId')} />
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </div>
                    {product.prices.map((price, idx) => (
                      <div key={price.id} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-16 flex-shrink-0 whitespace-nowrap">
                          {t('stripePriceId')}{product.prices.length > 1 ? ` ${idx + 1}` : ''}
                        </span>
                        {price.stripePriceId ? (
                          <CopyButton value={price.stripePriceId} label={t('copyPriceId')} />
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>
                    ))}
                  </div>
                </TableCell>

                {/* Ações */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Tooltip content={t('feesConfigureBtn')}>
                      <Button size="sm" variant="light" isIconOnly onPress={() => { setSelectedProduct(product); setIsProductFeesOpen(true); }} aria-label={t('feesConfigureBtn')}>
                        <Sliders className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t('generateLink')}>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() => {
                          setSelectedProduct(product);
                          setIsGenerateLinkOpen(true);
                        }}
                        aria-label={t('generateLink')}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </Button>
                    </Tooltip>
                    <Tooltip content={t('viewOnStripe')}>
                      <Button
                        size="sm"
                        variant="light"
                        isIconOnly
                        onPress={() =>
                          window.open(
                            `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                            '_blank'
                          )
                        }
                        aria-label={t('viewOnStripe')}
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

      {/* Modals */}
      <GlobalFeesModal isOpen={isGlobalFeesOpen} onClose={() => setIsGlobalFeesOpen(false)} />
      <CategoriesModal isOpen={isCategoriesOpen} onClose={() => setIsCategoriesOpen(false)} />
      <ProductFeesModal
        isOpen={isProductFeesOpen}
        onClose={() => {
          setIsProductFeesOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
      {selectedProduct && (
        <GenerateB2CCheckoutLinkModal
          isOpen={isGenerateLinkOpen}
          onClose={() => {
            setIsGenerateLinkOpen(false);
            setSelectedProduct(null);
          }}
          product={selectedProduct}
        />
      )}
    </>
  );
}
