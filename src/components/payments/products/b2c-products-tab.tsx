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
import { ExternalLink, DollarSign, FileX } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useListB2CProducts } from '@/src/common/hooks/useB2CProducts';

interface B2CProductsTabProps {
  refreshKey?: number;
}

export function B2CProductsTab({ refreshKey: _refreshKey }: B2CProductsTabProps) {
  const t = useTranslations('payments.productsPage');
  const { data: products, isLoading, error } = useListB2CProducts();

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
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
        <TableColumn>{t('columnSlug').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnPrices').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnActions').toUpperCase()}</TableColumn>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div>
                <p className="font-semibold text-gray-100">{product.name}</p>
                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                )}
              </div>
            </TableCell>
            <TableCell>
              <code className="text-xs bg-[#1a1a2e] px-2 py-1 rounded text-gray-300">
                {product.slug}
              </code>
            </TableCell>
            <TableCell>
              <Chip
                color={product.active ? 'success' : 'default'}
                variant="flat"
                size="sm"
              >
                {product.active ? t('statusActive') : t('statusInactive')}
              </Chip>
            </TableCell>
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
            <TableCell>
              <Button
                size="sm"
                variant="light"
                startContent={<ExternalLink className="w-3.5 h-3.5" />}
                onPress={() =>
                  window.open(
                    `https://dashboard.stripe.com/products/${product.stripeProductId}`,
                    '_blank'
                  )
                }
              >
                {t('viewOnStripe')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
