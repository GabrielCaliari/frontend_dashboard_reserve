'use client';

import { useState } from 'react';
import { Tabs, Tab, Button } from '@heroui/react';
import { Plus, RefreshCw, Package, Repeat } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { B2BProductsTab } from './b2b-products-tab';
import { B2CProductsTab } from './b2c-products-tab';
import { CreateProductModal } from './create-product-modal';

type ProductType = 'b2b' | 'b2c';

export function ProductsTabs() {
  const t = useTranslations('payments.productsPage');
  const [activeTab, setActiveTab] = useState<ProductType>('b2b');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="space-y-4">
      {/* Tabs header with actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as ProductType)}
          variant="underlined"
          classNames={{
            tabList: 'gap-6 border-b border-[#1f1f2e] pb-0',
            cursor: 'bg-primary',
            tab: 'px-0 h-10',
            tabContent: 'text-sm font-medium',
          }}
        >
          <Tab
            key="b2b"
            title={
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>{t('tabOneTime')}</span>
              </div>
            }
          />
          <Tab
            key="b2c"
            title={
              <div className="flex items-center gap-2">
                <Repeat className="w-4 h-4" />
                <span>{t('tabRecurring')}</span>
              </div>
            }
          />
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="flat"
            isIconOnly
            onPress={handleRefresh}
            aria-label={t('refresh')}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => setIsModalOpen(true)}
          >
            {t('newProduct')}
          </Button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'b2b' ? (
        <B2BProductsTab refreshKey={refreshKey} />
      ) : (
        <B2CProductsTab refreshKey={refreshKey} />
      )}

      {/* Create modal */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={activeTab}
        onSuccess={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
