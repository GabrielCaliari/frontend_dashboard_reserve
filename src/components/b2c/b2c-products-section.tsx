'use client';

import { Card, CardBody, CardHeader, Divider } from '@heroui/react';
import { GraduationCap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useListB2CProducts } from '@/src/common/hooks/useB2CProducts';
import { ProductsTable } from './products-table';

export function B2CProductsSection() {
  const { data: products, isLoading, error } = useListB2CProducts();
  const t = useTranslations('payments.b2c');

  return (
    <Card className="mb-6">
      <CardHeader className="flex gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex flex-col">
          <p className="text-lg font-semibold">{t('productsTitle')}</p>
          <p className="text-sm text-muted-foreground">
            {t('productsSubtitle')}
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        {error && (
          <div className="text-center py-4 text-red-500">
            {t('errorLoadingProducts')}: {error instanceof Error ? error.message : t('errorLoadingProducts')}
          </div>
        )}
        <ProductsTable products={products || []} isLoading={isLoading} />
      </CardBody>
    </Card>
  );
}
