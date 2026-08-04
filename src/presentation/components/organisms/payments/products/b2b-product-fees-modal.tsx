'use client';

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Select, SelectItem, Switch } from'@heroui/react';
import { Sliders, Percent, Truck, Package } from'lucide-react';
import { useState, useEffect } from'react';
import { useTranslations } from'next-intl';
import { useCategories, useUpdateB2BProductFees } from'@/src/shared/hooks/payments/use-b2c-fees';
import type { B2BProduct } from'@/src/shared/domain/types/@b2b-payments';

interface B2BProductFeesModalProps {
 isOpen: boolean;
 onClose: () => void;
 product: B2BProduct | null;
}

export function B2BProductFeesModal({ isOpen, onClose, product }: B2BProductFeesModalProps) {
 const t = useTranslations('payments.productsPage');
 const tCommon = useTranslations('common');
 const { data: categories = [] } = useCategories();
 const updateFees = useUpdateB2BProductFees({
 success: t('feesProductSaveSuccess'),
 error: t('feesProductSaveError'),
 });

 const [categoryId, setCategoryId] = useState('');
 const [chipOverride, setChipOverride] = useState('');
 const [shippingOverride, setShippingOverride] = useState('');
 const [requiresShipping, setRequiresShipping] = useState(false);

 useEffect(() => {
 if (isOpen && product) {
 setCategoryId(product.categoryId ??'');
 setChipOverride(product.chipCostOverride != null ? String(product.chipCostOverride) :'');
 setShippingOverride(product.shippingFeeOverride != null ? String((product.shippingFeeOverride / 100).toFixed(2)) :'');
 setRequiresShipping(product.requiresShipping ?? false);
 }
 }, [isOpen, product]);

 const handleSave = async () => {
 if (!product) return;
 await updateFees.mutateAsync({
 productId: product.id,
 data: {
 categoryId: categoryId || null,
 chipCostOverride: chipOverride !=='' ? parseFloat(chipOverride) : null,
 shippingFeeOverride: shippingOverride !=='' ? Math.round(parseFloat(shippingOverride) * 100) : null,
 requiresShipping,
 },
 });
 onClose();
 };

 const selectedCategory = categories.find((c) => c.id === categoryId);

 return (
 <Modal isOpen={isOpen} onClose={onClose} size="sm"
 classNames={{ base:'bg-background border border-white/10', header:'border-b border-white/[0.07]', footer:'border-t border-white/[0.07]' }}>
 <ModalContent>
 <ModalHeader className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
 <Sliders className="w-3.5 h-3.5 text-primary" />
 </div>
 <div className="min-w-0">
 <p className="text-sm font-semibold text-foreground truncate">{t('feesProductModalTitle')}</p>
 {product && <p className="text-xs text-muted-foreground truncate">{product.name}</p>}
 </div>
 </ModalHeader>

 <ModalBody className="py-5 space-y-4">
 <div className="space-y-1.5">
 <Select label={t('feesProductCategoryLabel')} placeholder={t('feesProductCategoryPlaceholder')}
 selectedKeys={categoryId ? [categoryId] : []} onChange={(e) => setCategoryId(e.target.value)}
 classNames={{ trigger:'bg-white/[0.03] border-white/[0.07]' }}>
 {categories.map((cat) => <SelectItem key={cat.id}>{cat.name}</SelectItem>)}
 </Select>
 {selectedCategory && (
 <div className="flex gap-2 px-1">
 {selectedCategory.chipCostPercent != null
 ? <span className="text-[11px] text-primary/70">{t('feesChipCost')}: {selectedCategory.chipCostPercent}%</span>
 : <span className="text-[11px] text-muted-foreground italic">{t('feesChipCost')}: {t('feesCategoriesInheritGlobal')}</span>}
 {selectedCategory.shippingFee != null
 ? <span className="text-[11px] text-blue-400/70">{t('feesShipping')}: R${(selectedCategory.shippingFee / 100).toFixed(2)}</span>
 : <span className="text-[11px] text-muted-foreground italic">{t('feesShipping')}: {t('feesCategoriesInheritGlobal')}</span>}
 </div>
 )}
 </div>

 <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
 <div className="flex items-center gap-2">
 <Package className="w-4 h-4 text-muted-foreground" />
 <div>
 <p className="text-sm text-foreground">{t('feesProductPhysicalLabel')}</p>
 <p className="text-xs text-muted-foreground">{t('feesProductPhysicalDesc')}</p>
 </div>
 </div>
 <Switch isSelected={requiresShipping} onValueChange={setRequiresShipping} size="sm" />
 </div>

 <div className="space-y-1">
 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">{t('feesProductOverridesTitle')}</p>
 <div className="space-y-3">
 <Input label={t('feesProductChipOverrideLabel')} placeholder={t('feesProductChipOverridePlaceholder')} value={chipOverride} onValueChange={setChipOverride} type="number" min="0" step="0.1" startContent={<Percent className="w-3.5 h-3.5 text-muted-foreground" />} classNames={{ inputWrapper:'bg-white/[0.03] border-white/[0.07]' }} />
 <Input label={t('feesProductShippingOverrideLabel')} placeholder={t('feesProductShippingOverridePlaceholder')} value={shippingOverride} onValueChange={setShippingOverride} type="number" min="0" step="0.01" startContent={<Truck className="w-3.5 h-3.5 text-muted-foreground" />} classNames={{ inputWrapper:'bg-white/[0.03] border-white/[0.07]' }} />
 </div>
 </div>

 <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] px-3 py-2">
 <p className="text-[11px] text-muted-foreground">{t('feesProductPriorityHint')}</p>
 </div>
 </ModalBody>

 <ModalFooter className="gap-2">
 <Button size="sm" variant="flat" onPress={onClose} isDisabled={updateFees.isPending}>{tCommon('cancel')}</Button>
 <Button size="sm" color="primary" onPress={handleSave} isLoading={updateFees.isPending}>{tCommon('save')}</Button>
 </ModalFooter>
 </ModalContent>
 </Modal>
 );
}
