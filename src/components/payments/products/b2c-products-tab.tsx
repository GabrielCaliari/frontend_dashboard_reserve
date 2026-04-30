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
} from '@heroui/react';
import { ExternalLink, DollarSign, FileX, Copy, Check, Link as LinkIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import { useListB2CProducts } from '@/src/common/hooks/useB2CProducts';
import { GenerateB2CCheckoutLinkModal } from './generate-b2c-checkout-link-modal';

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
      <code className="text-xs font-mono text-gray-300 truncate max-w-[160px]">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className="flex-shrink-0"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 text-gray-500 hover:text-gray-200 transition-colors" />
        )}
      </button>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────────────────────

export function B2CProductsTab({ refreshKey: _refreshKey }: B2CProductsTabProps) {
  const t = useTranslations('payments.productsPage');
  const { data: products, isLoading, error } = useListB2CProducts();
  const [selectedProduct, setSelectedProduct] = useState<typeof products[0] | null>(null);
  const [isGenerateLinkModalOpen, setIsGenerateLinkModalOpen] = useState(false);

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
    return (
      <div className="py-10 text-center text-red-400 text-sm">
        {t('errorLoading')}: {error instanceof Error ? error.message : t('errorUnknown')}
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
        <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnPrices').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnStripeIds').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnActions').toUpperCase()}</TableColumn>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            {/* Nome + descrição */}
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

            {/* Status */}
            <TableCell>
              <Chip
                color={product.active ? 'success' : 'default'}
                variant="flat"
                size="sm"
              >
                {product.active ? t('statusActive') : t('statusInactive')}
              </Chip>
            </TableCell>

            {/* Preços + periodicidade */}
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

            {/* IDs do Stripe — Product ID + Price ID(s) para o site final */}
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16 flex-shrink-0 whitespace-nowrap">
                    {t('stripeProductId')}
                  </span>
                  {product.stripeProductId ? (
                    <CopyButton
                      value={product.stripeProductId}
                      label={t('copyProductId')}
                    />
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
                      <CopyButton
                        value={price.stripePriceId}
                        label={t('copyPriceId')}
                      />
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
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => {
                    setSelectedProduct(product);
                    setIsGenerateLinkModalOpen(true);
                  }}
                  aria-label={t('generateLink')}
                  title={t('generateLink')}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                </Button>
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
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {/* Modal de gerar link */}
    {selectedProduct && (
      <GenerateB2CCheckoutLinkModal
        isOpen={isGenerateLinkModalOpen}
        onClose={() => {
          setIsGenerateLinkModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    )}
  </>
  );
}
