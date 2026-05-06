'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Chip, Spinner } from '@heroui/react';
import { Tags, Plus, Trash2, Pencil, Check, X, Percent, Truck } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/src/common/hooks/payments/use-b2c-fees';
import type { B2CCategory } from '@/src/common/@types/@b2c-products';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function autoSlug(name: string) {
  return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function CategoryRow({ category, onUpdate, onDelete }: {
  category: B2CCategory;
  onUpdate: (id: string, data: any) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('payments.productsPage');
  const tCommon = useTranslations('common');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [chipCost, setChipCost] = useState(category.chipCostPercent != null ? String(category.chipCostPercent) : '');
  const [shipping, setShipping] = useState(category.shippingFee != null ? String((category.shippingFee / 100).toFixed(2)) : '');

  const handleSave = () => {
    onUpdate(category.id, {
      name: name.trim() || category.name,
      chipCostPercent: chipCost !== '' ? parseFloat(chipCost) : null,
      shippingFee: shipping !== '' ? Math.round(parseFloat(shipping) * 100) : null,
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setName(category.name);
    setChipCost(category.chipCostPercent != null ? String(category.chipCostPercent) : '');
    setShipping(category.shippingFee != null ? String((category.shippingFee / 100).toFixed(2)) : '');
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-xl bg-white/[0.04] border border-white/10 p-3 space-y-3">
        <Input size="sm" label={t('columnName')} value={name} onValueChange={setName} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
        <div className="grid grid-cols-2 gap-2">
          <Input size="sm" label={t('feesGlobalChipCostLabel')} placeholder={t('feesCategoriesInheritGlobal')} value={chipCost} onValueChange={setChipCost} type="number" min="0" step="0.1" startContent={<Percent className="w-3 h-3 text-gray-500" />} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
          <Input size="sm" label={t('feesGlobalShippingLabel')} placeholder={t('feesCategoriesInheritGlobal')} value={shipping} onValueChange={setShipping} type="number" min="0" step="0.01" startContent={<Truck className="w-3 h-3 text-gray-500" />} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="flat" isIconOnly onPress={handleCancel}><X className="w-3.5 h-3.5" /></Button>
          <Button size="sm" color="primary" isIconOnly onPress={handleSave}><Check className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] group">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{category.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-600 font-mono">{category.slug}</span>
          {category.chipCostPercent != null
            ? <span className="text-[11px] text-primary/70">{category.chipCostPercent}%</span>
            : <span className="text-[11px] text-gray-600 italic">{t('feesChipCost')}: {t('feesCategoriesInheritGlobal')}</span>}
          {category.shippingFee != null
            ? <span className="text-[11px] text-blue-400/70">{t('feesShipping')}: R${(category.shippingFee / 100).toFixed(2)}</span>
            : <span className="text-[11px] text-gray-600 italic">{t('feesShipping')}: {t('feesCategoriesInheritGlobal')}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button size="sm" variant="light" isIconOnly onPress={() => setEditing(true)}><Pencil className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="light" color="danger" isIconOnly onPress={() => onDelete(category.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}

export function CategoriesModal({ isOpen, onClose }: CategoriesModalProps) {
  const t = useTranslations('payments.productsPage');
  const tCommon = useTranslations('common');
  const { data: categories = [], isLoading } = useCategories();
  const createMutation = useCreateCategory({
    success: t('feesCategoryCreateSuccess'),
    error: t('feesCategoryCreateError'),
  });
  const updateMutation = useUpdateCategory({
    success: t('feesCategorySaveSuccess'),
    error: t('feesCategorySaveError'),
  });
  const deleteMutation = useDeleteCategory({
    success: t('feesCategoryDeleteSuccess'),
    error: t('feesCategoryDeleteError'),
  });

  const [newName, setNewName] = useState('');
  const [newChipCost, setNewChipCost] = useState('');
  const [newShipping, setNewShipping] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createMutation.mutateAsync({
      name: newName.trim(),
      slug: autoSlug(newName),
      chipCostPercent: newChipCost !== '' ? parseFloat(newChipCost) : null,
      shippingFee: newShipping !== '' ? Math.round(parseFloat(newShipping) * 100) : null,
    });
    setNewName(''); setNewChipCost(''); setNewShipping('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" scrollBehavior="inside"
      classNames={{ base: 'bg-[#0e0e1a] border border-white/10', header: 'border-b border-white/[0.07]', footer: 'border-t border-white/[0.07]', body: 'max-h-[60vh]' }}>
      <ModalContent>
        <ModalHeader className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
            <Tags className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold text-gray-100">{t('feesCategoriesModalTitle')}</span>
          <Chip size="sm" variant="flat" className="ml-auto">{categories.length}</Chip>
        </ModalHeader>

        <ModalBody className="py-4 space-y-3">
          {/* Create new */}
          <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 space-y-3">
            <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">{t('feesCategoriesNewTitle')}</p>
            <Input size="sm" placeholder={t('feesCategoriesNamePlaceholder')} value={newName} onValueChange={setNewName} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
            <div className="grid grid-cols-2 gap-2">
              <Input size="sm" label={t('feesGlobalChipCostLabel')} placeholder={t('feesCategoriesInheritGlobal')} value={newChipCost} onValueChange={setNewChipCost} type="number" min="0" step="0.1" startContent={<Percent className="w-3 h-3 text-gray-500" />} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
              <Input size="sm" label={t('feesGlobalShippingLabel')} placeholder={t('feesCategoriesInheritGlobal')} value={newShipping} onValueChange={setNewShipping} type="number" min="0" step="0.01" startContent={<Truck className="w-3 h-3 text-gray-500" />} classNames={{ inputWrapper: 'bg-white/[0.03] border-white/[0.07]' }} />
            </div>
            <Button size="sm" color="primary" startContent={<Plus className="w-3.5 h-3.5" />} onPress={handleCreate} isLoading={createMutation.isPending} isDisabled={!newName.trim()} className="w-full">
              {t('feesCategoriesCreateBtn')}
            </Button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
          ) : categories.length === 0 ? (
            <p className="text-center text-sm text-gray-600 py-6">{t('feesCategoriesEmpty')}</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <CategoryRow key={cat.id} category={cat}
                  onUpdate={(id, data) => updateMutation.mutate({ id, data })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button size="sm" variant="flat" onPress={onClose}>{tCommon('close')}</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
