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
} from '@heroui/react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { b2bPaymentsService } from '@/src/common/services/b2b-payments-service';
import { b2cProductsService } from '@/src/common/services/b2c-products-service';

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
  };

  const [form, setForm] = useState(emptyForm);

  // Reset form whenever the modal opens or the type changes
  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultType]);

  const set = (field: keyof typeof emptyForm, value: string) =>
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
        });
        queryClient.invalidateQueries({ queryKey: ['b2b-products'] });
      } else {
        if (!form.unitAmount) {
          setError(t('errorAmount'));
          setIsLoading(false);
          return;
        }
        const amountInCents = Math.round(parseFloat(form.unitAmount) * 100);
        await b2cProductsService.createProduct({
          name: form.name.trim(),
          description: form.description.trim(),
          slug: form.slug.trim(),
          interval: form.interval,
          intervalCount: parseInt(form.intervalCount, 10),
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

  const intervalOptions: { value: RecurringInterval; labelKey: string; descKey: string }[] = [
    { value: 'month', labelKey: 'intervalMonthLabel', descKey: 'intervalMonthDesc' },
    { value: 'year', labelKey: 'intervalYearLabel', descKey: 'intervalYearDesc' },
    { value: 'quarter', labelKey: 'intervalQuarterLabel', descKey: 'intervalQuarterDesc' },
    { value: 'week', labelKey: 'intervalWeekLabel', descKey: 'intervalWeekDesc' },
  ];

  const modalTitle =
    billingType === 'b2b'
      ? `${t('title')} — ${t('typeOneTime')}`
      : `${t('title')} — ${t('typeRecurring')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      classNames={{
        base: 'bg-[#0f0f1a] border border-[#1f1f2e]',
        header: 'border-b border-[#1f1f2e]',
        footer: 'border-t border-[#1f1f2e]',
      }}
    >
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>
            <h3 className="text-base font-semibold text-gray-100">{modalTitle}</h3>
          </ModalHeader>

          <ModalBody className="gap-4">
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
              classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
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
              classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
            />

            <Textarea
              label={t('descriptionLabel')}
              placeholder={t('descriptionPlaceholder')}
              value={form.description}
              onValueChange={(v) => set('description', v)}
              minRows={2}
              isDisabled={isLoading}
              classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
            />

            {/* B2B: price + currency */}
            {billingType === 'b2b' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  label={t('priceLabel')}
                  placeholder={t('pricePlaceholder')}
                  value={form.price}
                  onValueChange={(v) => set('price', v)}
                  startContent={
                    <span className="text-gray-400 text-sm">
                      {form.currency === 'brl' ? 'R$' : '$'}
                    </span>
                  }
                  isRequired
                  isDisabled={isLoading}
                  classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
                />
                <Select
                  label={t('currencyLabel')}
                  selectedKeys={[form.currency]}
                  onChange={(e) => set('currency', e.target.value)}
                  isDisabled={isLoading}
                  classNames={{ trigger: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
                >
                  <SelectItem key="brl" value="brl">{t('currencyBrl')}</SelectItem>
                  <SelectItem key="usd" value="usd">{t('currencyUsd')}</SelectItem>
                </Select>
              </div>
            )}

            {/* B2C: periodicity + amount + currency */}
            {billingType === 'b2c' && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">{t('periodicityLabel')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {intervalOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => set('interval', opt.value)}
                        className={`p-3 rounded-xl border text-left transition-colors ${
                          form.interval === opt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-[#2a2a3e] bg-[#1a1a2e] hover:border-[#3a3a4e]'
                        }`}
                      >
                        <p className="text-sm font-medium text-gray-200">{t(opt.labelKey as any)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t(opt.descKey as any)}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    label={t('amountLabel')}
                    placeholder={t('amountPlaceholder')}
                    value={form.unitAmount}
                    onValueChange={(v) => set('unitAmount', v)}
                    startContent={
                      <span className="text-gray-400 text-sm">
                        {form.b2cCurrency === 'brl' ? 'R$' : '$'}
                      </span>
                    }
                    isRequired
                    isDisabled={isLoading}
                    classNames={{ inputWrapper: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
                  />
                  <Select
                    label={t('currencyLabel')}
                    selectedKeys={[form.b2cCurrency]}
                    onChange={(e) => set('b2cCurrency', e.target.value)}
                    isDisabled={isLoading}
                    classNames={{ trigger: 'bg-[#1a1a2e] border-[#2a2a3e]' }}
                  >
                    <SelectItem key="brl" value="brl">{t('currencyBrl')}</SelectItem>
                    <SelectItem key="usd" value="usd">{t('currencyUsd')}</SelectItem>
                  </Select>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="flat" onPress={handleClose} isDisabled={isLoading}>
              {tCommon('cancel')}
            </Button>
            <Button color="primary" type="submit" isLoading={isLoading}>
              {isLoading ? t('creating') : t('create')}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
