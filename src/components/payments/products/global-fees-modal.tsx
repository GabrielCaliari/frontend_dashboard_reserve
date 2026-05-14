'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Spinner } from '@heroui/react';
import { Settings, Percent } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGlobalFees, useUpsertGlobalFees } from '@/src/common/hooks/payments/use-b2c-fees';
import { CurrencyInput } from '@/src/components/ui/currency-input';

interface GlobalFeesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalFeesModal({ isOpen, onClose }: GlobalFeesModalProps) {
  const t = useTranslations('payments.productsPage');
  const tCommon = useTranslations('common');
  const { data: config, isLoading } = useGlobalFees();
  const upsert = useUpsertGlobalFees({
    success: t('feesGlobalSaveSuccess'),
    error: t('feesGlobalSaveError'),
  });

  const [chipCost, setChipCost] = useState('');
  const [shipping, setShipping] = useState('');
  const [currency, setCurrency] = useState<'usd' | 'brl'>('usd');

  useEffect(() => {
    if (isOpen && config) {
      setChipCost(config.chipCostPercent > 0 ? String(config.chipCostPercent) : '');
      setShipping(config.shippingFee > 0 ? String(config.shippingFee / 100) : '');
    } else if (isOpen && !config) {
      setChipCost('');
      setShipping('');
      setCurrency('usd');
    }
  }, [isOpen, config]);

  const handleSave = async () => {
    await upsert.mutateAsync({
      chipCostPercent: parseFloat(chipCost) || 0,
      shippingFee: Math.round((parseFloat(shipping) || 0) * 100),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm"
      classNames={{ base: 'bg-[#0e0e1a] border border-white/10', header: 'border-b border-white/[0.07]', footer: 'border-t border-white/[0.07]' }}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Settings className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-gray-100">{t('feesGlobalModalTitle')} — Recurring</span>
        </ModalHeader>

        <ModalBody className="py-5 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4"><Spinner size="sm" /></div>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-relaxed">{t('feesGlobalModalDesc')}</p>

              <Input
                label={t('feesGlobalChipCostLabel')}
                placeholder="2.5"
                value={chipCost}
                onValueChange={(v) => setChipCost(v.replace(/[^0-9.]/g, ''))}
                startContent={<Percent className="w-3.5 h-3.5 text-gray-500" />}
                description={t('feesGlobalChipCostDesc')}
                classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }}
              />

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <CurrencyInput
                    label={t('feesGlobalShippingLabel')}
                    placeholder="15,00"
                    value={shipping}
                    onValueChange={setShipping}
                    currency={currency}
                    description={t('feesGlobalShippingDesc')}
                    classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }}
                  />
                </div>
                <Select
                  size="sm"
                  selectedKeys={[currency]}
                  onChange={(e) => setCurrency(e.target.value as 'usd' | 'brl')}
                  className="w-24 pb-10"
                  aria-label="Currency"
                  classNames={{ trigger: 'bg-white/[0.03] border-white/[0.07] h-[56px]' }}
                >
                  <SelectItem key="usd">USD</SelectItem>
                  <SelectItem key="brl">BRL</SelectItem>
                </Select>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button size="sm" variant="flat" onPress={onClose} isDisabled={upsert.isPending}>{tCommon('cancel')}</Button>
          <Button size="sm" color="primary" onPress={handleSave} isLoading={upsert.isPending} isDisabled={isLoading}>{tCommon('save')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
