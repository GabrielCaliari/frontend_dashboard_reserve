'use client';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch,
} from '@heroui/react';
import { Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { b2bPaymentsService } from '@/src/common/services/b2b-payments-service';
import { b2cProductsService } from '@/src/common/services/b2c-products-service';
import { BillingConfigSelector } from './billing-config-selector';
import { CurrencyInput } from '@/src/components/ui/currency-input';
import type { BillingConfiguration } from '@/src/common/@types/@billing-config';

type BillingType = 'b2b' | 'b2c';
type RecurringInterval = 'month' | 'year' | 'quarter' | 'week';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: BillingType;
  onSuccess?: () => void;
}

export function CreateProductModal({
  isOpen,
  onClose,
  defaultType = 'b2b',
  onSuccess,
}: CreateProductModalProps) {
  const t = useTranslations('payments.productsPage.createModal');
  const tCommon = useTranslations('common');
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // billingType is always driven by the active tab — no user toggle inside the modal
  const billingType: BillingType = defaultType;

  const emptyForm = {
    name: '',
    slug: '',
    description: '',
    price: '',
    currency: 'brl',
    interval: 'month' as RecurringInterval,
    intervalCount: '1',
    unitAmount: '',
    b2cCurrency: 'brl',
    priceName: '',
    categories: [] as string[],
    requiresShipping: false,
    billingConfig: {
      mode: 'recurring_infinite',
      interval: 'month',
      intervalCount: 1,
    } as BillingConfiguration,
  };

  const [form, setForm] = useState(emptyForm);
  const [categoryInput, setCategoryInput] = useState('');

  // Reset form whenever the modal opens or the type changes
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setCategoryInput('');
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultType]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const set = (field: keyof typeof emptyForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  const handleNameChange = (value: string) => {
    const currentSlug = form.slug;
    const expectedSlug = autoSlug(form.name);
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: !currentSlug || currentSlug === expectedSlug ? autoSlug(value) : currentSlug,
    }));
  };

  const handleAddCategory = () => {
    const trimmed = categoryInput.trim().toLowerCase();
    if (trimmed && !form.categories.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        categories: [...prev.categories, trimmed],
      }));
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.slug.trim()) {
      setError(t('errorRequired'));
      return;
    }

    setIsLoading(true);
    try {
      if (billingType === 'b2b') {
        if (!form.price) {
          setError(t('errorPrice'));
          setIsLoading(false);
          return;
        }
        const priceInCents = Math.round(parseFloat(form.price) * 100);
        await b2bPaymentsService.createProduct({
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim(),
          price: priceInCents,
          currency: form.currency,
          categories: form.categories,
          requiresShipping: form.requiresShipping,
        });
        queryClient.invalidateQueries({ queryKey: ['b2b-products'] });
      } else {
        if (!form.unitAmount) {
          setError(t('errorAmount'));
          setIsLoading(false);
          return;
        }
        
        const amountInCents = Math.round(parseFloat(form.unitAmount) * 100);
        
        // Mapear modo do frontend para backend
        const billingModeMap = {
          'recurring_infinite': 'unlimited',
          'recurring_limited': 'limited',
          'one_time_expiring': 'one_time_exp',
        } as const;
        
        const backendBillingMode = billingModeMap[form.billingConfig.mode];
        
        // Calcular accessDurationDays se for one_time_expiring
        let accessDurationDays: number | undefined;
        if (form.billingConfig.mode === 'one_time_expiring' && form.billingConfig.accessDuration) {
          const unit = form.billingConfig.accessDurationUnit || 'month';
          const duration = form.billingConfig.accessDuration;
          
          // Converter para dias
          if (unit === 'day') {
            accessDurationDays = duration;
          } else if (unit === 'month') {
            accessDurationDays = duration * 30;
          } else if (unit === 'year') {
            accessDurationDays = duration * 365;
          }
        }
        
        await b2cProductsService.createProduct({
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim(),
          priceName: form.priceName.trim() || form.name.trim(),
          categories: form.categories,
          requiresShipping: form.requiresShipping,
          billingMode: backendBillingMode,
          // Interval só para unlimited e limited
          interval: (form.billingConfig.mode !== 'one_time_expiring') 
            ? form.billingConfig.interval 
            : undefined,
          intervalCount: (form.billingConfig.mode !== 'one_time_expiring')
            ? form.billingConfig.intervalCount
            : undefined,
          // maxBillingCycles só para limited
          maxBillingCycles: form.billingConfig.maxCharges,
          // accessDurationDays só para one_time_exp
          accessDurationDays,
          unitAmount: amountInCents,
          currency: form.b2cCurrency,
        });
        queryClient.invalidateQueries({ queryKey: ['b2c-products'] });
      }

      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          t('errorGeneric')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  const modalTitle =
    billingType === 'b2b'
      ? `${t('title')} — ${t('typeOneTime')}`
      : `${t('title')} — ${t('typeRecurring')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        base: 'bg-background border border-border',
        header: 'border-b border-border',
        body: 'py-4',
        footer: 'border-t border-border',
      }}
    >
      <ModalContent>
        <ModalHeader>
          <h3 className="text-base font-semibold text-foreground">{modalTitle}</h3>
        </ModalHeader>

        <ModalBody className="gap-4">
          <form id="create-product-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Common fields */}
            <Input
              label={t('nameLabel')}
              placeholder={t('namePlaceholder')}
              value={form.name}
              onValueChange={handleNameChange}
              isRequired
              isDisabled={isLoading}
              classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
            />

            <Input
              label={t('slugLabel')}
              placeholder={t('slugPlaceholder')}
              value={form.slug}
              onValueChange={(v) =>
                set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))
              }
              description={t('slugDesc')}
              isRequired
              isDisabled={isLoading}
              classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
            />

            <Textarea
              label={t('descriptionLabel')}
              placeholder={t('descriptionPlaceholder')}
              value={form.description}
              onValueChange={(v) => set('description', v)}
              minRows={2}
              isDisabled={isLoading}
              classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
            />

            {/* Categorias - para B2B e B2C */}
            <div className="space-y-2">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input
                    label={t('categoriesLabel')}
                    placeholder={t('categoriesPlaceholder')}
                    value={categoryInput}
                    onValueChange={setCategoryInput}
                    onKeyDown={handleCategoryKeyDown}
                    description={t('categoriesDesc')}
                    isDisabled={isLoading}
                    classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
                  />
                </div>
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleAddCategory}
                  isDisabled={isLoading || !categoryInput.trim()}
                  className="mb-6"
                >
                  {t('addCategory')}
                </Button>
              </div>
              
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg border border-[#2a2a3e]">
                  {form.categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-1 px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                    >
                      <span>{category}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(category)}
                        className="hover:text-primary-600 transition-colors"
                        disabled={isLoading}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle produto físico */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted border border-[#2a2a3e]">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-foreground">{t('physicalProductLabel')}</p>
                  <p className="text-xs text-gray-600">{t('physicalProductDesc')}</p>
                </div>
              </div>
              <Switch
                isSelected={form.requiresShipping}
                onValueChange={(v) => set('requiresShipping', v)}
                isDisabled={isLoading}
                size="sm"
              />
            </div>

            {/* B2B: price + currency */}
            {billingType === 'b2b' && (
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label={t('priceLabel')}
                  placeholder="49,90"
                  value={form.price}
                  onValueChange={(v) => set('price', v)}
                  currency={form.currency as 'brl' | 'usd'}
                  isRequired
                  isDisabled={isLoading}
                  classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
                />
                <Select
                  label={t('currencyLabel')}
                  selectedKeys={[form.currency]}
                  onChange={(e) => set('currency', e.target.value)}
                  isDisabled={isLoading}
                  classNames={{ trigger: 'bg-muted border-[#2a2a3e]' }}
                >
                  <SelectItem key="brl">{t('currencyBrl')}</SelectItem>
                  <SelectItem key="usd">{t('currencyUsd')}</SelectItem>
                </Select>
              </div>
            )}

            {/* B2C: billing config + amount + currency */}
            {billingType === 'b2c' && (
              <div className="space-y-4">
                {/* Nome do Preço */}
                <Input
                  label={t('priceNameLabel')}
                  placeholder={t('priceNamePlaceholder')}
                  value={form.priceName}
                  onValueChange={(v) => set('priceName', v)}
                  description={t('priceNameDesc')}
                  isDisabled={isLoading}
                  classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
                />

                {/* Configuração de Billing */}
                <BillingConfigSelector
                  value={form.billingConfig}
                  onChange={(config) => set('billingConfig', config)}
                  isDisabled={isLoading}
                />

                {/* Valor e Moeda */}
                <div className="grid grid-cols-2 gap-3">
                  <CurrencyInput
                    label={t('amountLabel')}
                    placeholder="49,90"
                    value={form.unitAmount}
                    onValueChange={(v) => set('unitAmount', v)}
                    currency={form.b2cCurrency as 'brl' | 'usd'}
                    isRequired
                    isDisabled={isLoading}
                    classNames={{ inputWrapper: 'bg-muted border-[#2a2a3e]' }}
                  />
                  <Select
                    label={t('currencyLabel')}
                    selectedKeys={[form.b2cCurrency]}
                    onChange={(e) => set('b2cCurrency', e.target.value)}
                    isDisabled={isLoading}
                    classNames={{ trigger: 'bg-muted border-[#2a2a3e]' }}
                  >
                    <SelectItem key="brl">{t('currencyBrl')}</SelectItem>
                    <SelectItem key="usd">{t('currencyUsd')}</SelectItem>
                  </Select>
                </div>
              </div>
            )}
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="flat" onPress={handleClose} isDisabled={isLoading}>
            {tCommon('cancel')}
          </Button>
          <Button color="primary" type="submit" form="create-product-form" isLoading={isLoading}>
            {isLoading ? t('creating') : t('create')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
