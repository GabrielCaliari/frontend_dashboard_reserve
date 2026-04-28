'use client';

import { Card, CardBody, CardHeader, Divider, Button } from '@heroui/react';
import { Briefcase, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useListB2BProducts } from '@/src/common/hooks/useB2BPayments';
import { B2BProductsTable } from './b2b-products-table';
import { CreateB2BProductModal } from './create-b2b-product-modal';

export function B2BProductsSection() {
  const { data: products, isLoading, error } = useListB2BProducts();
  const t = useTranslations('payments.b2b');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="flex gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-lg font-semibold">{t('productsTitle')}</p>
            <p className="text-sm text-gray-500">
              {t('productsSubtitle')}
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsCreateModalOpen(true)}
          >
            {t('createProduct')}
          </Button>
        </CardHeader>
        <Divider />
        <CardBody>
          {error && (
            <div className="text-center py-4 text-red-500">
              {t('errorLoadingProducts')}: {error instanceof Error ? error.message : t('errorLoadingProducts')}
            </div>
          )}
          <B2BProductsTable products={products || []} isLoading={isLoading} />
        </CardBody>
      </Card>

      <CreateB2BProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}
