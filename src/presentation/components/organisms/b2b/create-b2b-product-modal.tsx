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
} from'@heroui/react';
import { useTranslations } from'next-intl';
import { useState } from'react';
import { useQueryClient } from'@tanstack/react-query';
import { b2bPaymentsService } from'@/src/modules/b2b-payments/infrastructure/adapters';

interface CreateB2BProductModalProps {
 isOpen: boolean;
 onClose: () => void;
}

export function CreateB2BProductModal({ isOpen, onClose }: CreateB2BProductModalProps) {
 const t = useTranslations('payments.b2b');
 const tCommon = useTranslations('common');
 const queryClient = useQueryClient();
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const [formData, setFormData] = useState({
 name:'',
 description:'',
 slug:'',
 price:'',
 currency:'brl',
 });

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsLoading(true);
 setError(null);

 try {
 // Validação básica
 if (!formData.name || !formData.slug || !formData.price) {
 setError(t('createError'));
 setIsLoading(false);
 return;
 }

 // Converter preço para centavos
 const priceInCents = Math.round(parseFloat(formData.price) * 100);

 await b2bPaymentsService.createProduct({
 name: formData.name,
 description: formData.description,
 slug: formData.slug,
 price: priceInCents,
 currency: formData.currency,
 });

 // Invalidar cache para recarregar produtos
 queryClient.invalidateQueries({ queryKey: ['b2b-products'] });

 // Resetar formulário e fechar modal
 setFormData({
 name:'',
 description:'',
 slug:'',
 price:'',
 currency:'brl',
 });
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : t('createError'));
 } finally {
 setIsLoading(false);
 }
 };

 const handleClose = () => {
 if (!isLoading) {
 setFormData({
 name:'',
 description:'',
 slug:'',
 price:'',
 currency:'brl',
 });
 setError(null);
 onClose();
 }
 };

 return (
 <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
 <ModalContent>
 <form onSubmit={handleSubmit}>
 <ModalHeader className="flex flex-col gap-1">
 {t('createProductTitle')}
 </ModalHeader>
 <ModalBody>
 {error && (
 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
 {error}
 </div>
 )}

 <Input
 label={t('productName')}
 placeholder={t('productNamePlaceholder')}
 value={formData.name}
 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
 isRequired
 isDisabled={isLoading}
 />

 <Input
 label={t('productSlug')}
 placeholder={t('productSlugPlaceholder')}
 value={formData.slug}
 onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'-') })}
 description={t('productSlugDescription')}
 isRequired
 isDisabled={isLoading}
 />

 <Textarea
 label={t('productDescription')}
 placeholder={t('productDescriptionPlaceholder')}
 value={formData.description}
 onChange={(e) => setFormData({ ...formData, description: e.target.value })}
 minRows={3}
 isDisabled={isLoading}
 />

 <div className="grid grid-cols-2 gap-4">
 <Input
 type="number"
 step="0.01"
 label={t('productPrice')}
 placeholder="99.90"
 value={formData.price}
 onChange={(e) => setFormData({ ...formData, price: e.target.value })}
 startContent={
 <div className="pointer-events-none flex items-center">
 <span className="text-muted-foreground text-small">
 {formData.currency ==='brl' ?'R$' :'$'}
 </span>
 </div>
 }
 isRequired
 isDisabled={isLoading}
 />

 <Select
 label={t('productCurrency')}
 selectedKeys={[formData.currency]}
 onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
 isDisabled={isLoading}
 >
 <SelectItem key="brl">
 BRL - Real Brasileiro
 </SelectItem>
 <SelectItem key="usd">
 USD - Dólar Americano
 </SelectItem>
 </Select>
 </div>
 </ModalBody>
 <ModalFooter>
 <Button
 color="danger"
 variant="light"
 onPress={handleClose}
 isDisabled={isLoading}
 >
 {tCommon('cancel')}
 </Button>
 <Button
 color="primary"
 type="submit"
 isLoading={isLoading}
 >
 {isLoading ? t('creating') : t('create')}
 </Button>
 </ModalFooter>
 </form>
 </ModalContent>
 </Modal>
 );
}
