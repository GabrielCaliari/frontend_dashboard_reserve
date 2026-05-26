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
  Spinner,
} from '@heroui/react';
import { ExternalLink, DollarSign } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { B2BProduct } from '@/src/common/@types/@b2b-payments';

interface B2BProductsTableProps {
  products: B2BProduct[];
  isLoading?: boolean;
}

export function B2BProductsTable({ products, isLoading }: B2BProductsTableProps) {
  const t = useTranslations('payments.b2b');

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
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
        {t('noProducts')}
      </div>
    );
  }

  return (
    <Table aria-label={t('productsTitle')}>
      <TableHeader>
        <TableColumn>{t('columnName').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnSlug').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnStatus').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnPrice').toUpperCase()}</TableColumn>
        <TableColumn>{t('columnActions').toUpperCase()}</TableColumn>
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
              <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
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
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">
                  {formatPrice(product.price, product.currency)}
                </span>
                <span className="text-xs text-muted-foreground">{t('oneTime')}</span>
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
