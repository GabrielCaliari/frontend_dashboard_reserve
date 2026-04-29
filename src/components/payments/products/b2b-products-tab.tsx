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
import { ExternalLink, DollarSign, FileX, Copy, Check, Link } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';
import { useListB2BProducts } from '@/src/common/hooks/useB2BPayments';
import type { B2BProduct } from '@/src/common/@types/@b2b-payments';
import { GenerateCheckoutLinkModal } from './generate-checkout-link-modal';

interface B2BProductsTabProps {
  refreshKey?: number;
}

// ─── Copy button with feedback ────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations('payments.productsPage');
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
        aria-label={copied ? t('copied') : label}
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

export function B2BProductsTab({ refreshKey: _refreshKey }: B2BProductsTabProps) {
  const t = useTranslations('payments.productsPage');
  const { data: products, isLoading, error } = useListB2BProducts();
  const [linkProduct, setLinkProduct] = useState<B2BProduct | null>(null);

  const formatPrice = (amount: number, currency: string) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
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
        {t('errorLoading')}: {error instanceof Error ? error.message : t('errorUnknown')}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-gray-500">
        <FileX className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">{t('noB2BProducts')}</p>
        <p className="text-xs text-gray-600">{t('noB2BProductsDesc')}</p>
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label={t('tabOneTime')}
        classNames={{
          wrapper: 'rounded-xl border border-[#1f1f2e]',
          th: 'bg-[#1a1a2e] text-xs font-semibold uppercase tracking-wider text-gray-400',
          tr: 'hover:bg-[#1a1a2e]/50 transition-colors',
        }}
      >
      <TableHeader>
        <TableColumn>{t('columnName').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnPrice').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnStripeIds').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnActions').toUpperCase()}</TableColumn>
      </TableHeader>
      <TableBody>
        {(products as B2BProduct[]).map((product) => (
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

            {/* Preço */}
            <TableCell>
              <div className="flex items-center gap-1.5 text-sm">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-gray-100">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className="text-xs text-gray-500">{t('oneTimeLabel')}</span>
              </div>
            </TableCell>

            {/* IDs do Stripe — para usar no site final */}
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-16 flex-shrink-0 whitespace-nowrap">
                    {t('stripePriceId')}
                  </span>
                  {product.stripePriceId ? (
                    <CopyButton
                      value={product.stripePriceId}
                      label={t('copyPriceId')}
                    />
                  ) : (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>
              </div>
            </TableCell>

            {/* Ações */}
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<Link className="w-3.5 h-3.5" />}
                  onPress={() => setLinkProduct(product)}
                >
                  {t('generateLink')}
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

    <GenerateCheckoutLinkModal
      isOpen={!!linkProduct}
      onClose={() => setLinkProduct(null)}
      product={linkProduct}
    />
    </>
  );
}
