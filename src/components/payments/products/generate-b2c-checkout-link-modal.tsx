'use client';

import {
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
 Button,
 Input,
 Select,
 SelectItem,
 Chip,
} from'@heroui/react';
import { Copy, Check, ExternalLink, DollarSign, Link } from'lucide-react';
import { useTranslations } from'next-intl';
import { useState, useCallback, useEffect } from'react';
import { toast } from'sonner';
import { createCheckoutSessionService } from'@/src/common/services/payments/subscriptions-service';

interface ProductPrice {
 id: string;
 stripePriceId: string;
 unitAmount: number;
 currency: string;
 interval: string;
 intervalCount: number;
 active: boolean;
}

interface Product {
 id: string;
 name: string;
 description?: string;
 prices: ProductPrice[];
 active: boolean;
 stripeProductId: string;
}

interface GenerateB2CCheckoutLinkModalProps {
 isOpen: boolean;
 onClose: () => void;
 product: Product | null;
}

export function GenerateB2CCheckoutLinkModal({
 isOpen,
 onClose,
 product,
}: GenerateB2CCheckoutLinkModalProps) {
 const t = useTranslations('payments.productsPage');
 const [selectedPriceId, setSelectedPriceId] = useState('');
 const [customerEmail, setCustomerEmail] = useState('');
 const [customerName, setCustomerName] = useState('');
 const [checkoutUrl, setCheckoutUrl] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [linkCopied, setLinkCopied] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const activePrices = product?.prices.filter((p) => p.active) || [];

 // Reset on open
 useEffect(() => {
 if (isOpen) {
 setSelectedPriceId('');
 setCustomerEmail('');
 setCustomerName('');
 setCheckoutUrl('');
 setLinkCopied(false);
 setError(null);
 }
 }, [isOpen]);

 const formatPrice = (amount: number, currency: string) =>
 new Intl.NumberFormat('pt-BR', {
 style:'currency',
 currency: currency.toUpperCase(),
 }).format(amount / 100);

 const formatInterval = (interval: string, count: number) => {
 const labelMap: Record<string, string> = {
 month:'Mensal',
 year:'Anual',
 week:'Semanal',
 day:'Diário',
 };
 const label = labelMap[interval] ?? interval;
 return count > 1 ?`A cada ${count} ${label.toLowerCase()}s` : label;
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);

 if (!selectedPriceId) {
 setError('Selecione um plano');
 return;
 }

 if (!customerEmail.trim()) {
 setError('Informe o email do cliente');
 return;
 }

 if (!product) return;

 setIsGenerating(true);
 try {
 // Buscar tenantId do cookie
 const getCookie = (name: string) => {
 const value =`; ${document.cookie}`;
 const parts = value.split(`; ${name}=`);
 if (parts.length === 2) return parts.pop()?.split(';').shift();
 return null;
 };

 const tenantId = getCookie('x-tenant-id');
 
 if (!tenantId) {
 throw new Error('Tenant não encontrado. Faça login novamente.');
 }

 const data = await createCheckoutSessionService({
 priceId: selectedPriceId,
 tenantId,
 successUrl:`${window.location.origin}/dashboard/payments/subscriptions?success=true`,
 cancelUrl:`${window.location.origin}/dashboard/payments/subscriptions?canceled=true`,
 });

 setCheckoutUrl(data.checkoutUrl);
 toast.success('Link gerado com sucesso!');
 } catch (error: any) {
 console.error('Erro ao gerar link:', error);
 const errorMessage = error?.response?.data?.message || error?.message ||'Erro ao gerar link';
 setError(errorMessage);
 toast.error(errorMessage);
 } finally {
 setIsGenerating(false);
 }
 };

 const handleCopyLink = useCallback(async () => {
 if (!checkoutUrl) return;
 try {
 await navigator.clipboard.writeText(checkoutUrl);
 } catch {
 const el = document.createElement('textarea');
 el.value = checkoutUrl;
 document.body.appendChild(el);
 el.select();
 document.execCommand('copy');
 document.body.removeChild(el);
 }
 setLinkCopied(true);
 toast.success('Link copiado!');
 setTimeout(() => setLinkCopied(false), 1500);
 }, [checkoutUrl]);

 const handleClose = () => {
 if (isGenerating) return;
 onClose();
 };

 if (!product) return null;

 return (
 <Modal
 isOpen={isOpen}
 onClose={handleClose}
 size="lg"
 classNames={{
 base:'bg-background border border-border',
 header:'border-b border-border',
 footer:'border-t border-border',
 }}
 >
 <ModalContent>
 <form onSubmit={handleSubmit}>
 <ModalHeader>
 <div className="flex items-center gap-2">
 <Link className="w-4 h-4 text-primary" />
 <div>
 <h3 className="text-base font-semibold text-foreground">
 Gerar Link de Checkout
 </h3>
 <p className="text-xs text-muted-foreground font-normal mt-0.5">
 {product.name}
 </p>
 </div>
 </div>
 </ModalHeader>

 <ModalBody className="gap-4">
 {error && (
 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
 {error}
 </div>
 )}

 {/* Success state — show the generated link */}
 {checkoutUrl ? (
 <div className="space-y-4">
 <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
 ✅ Link gerado com sucesso!
 </div>

 <div className="p-3 rounded-xl bg-default-100 border border-[#2a2a3e] space-y-2">
 <p className="text-xs text-muted-foreground">Checkout URL</p>
 <p className="text-xs font-mono text-foreground break-all">{checkoutUrl}</p>
 </div>

 <div className="flex gap-2">
 <Button
 className="flex-1"
 color="primary"
 startContent={<ExternalLink className="w-4 h-4" />}
 onPress={() => window.open(checkoutUrl,'_blank')}
 >
 Abrir Checkout
 </Button>
 <Button
 variant="flat"
 startContent={
 linkCopied ? (
 <Check className="w-4 h-4 text-green-400" />
 ) : (
 <Copy className="w-4 h-4" />
 )
 }
 onPress={handleCopyLink}
 >
 {linkCopied ?'Copiado!' :'Copiar Link'}
 </Button>
 </div>
 </div>
 ) : (
 /* Form state */
 <>
 <p className="text-sm text-muted-foreground">
 Preencha os dados abaixo para gerar um link de checkout
 </p>

 {/* Seleção de plano */}
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">
 Selecione o plano *
 </label>
 {activePrices.length === 0 ? (
 <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
 <p className="text-sm text-yellow-400">
 Este produto não possui preços ativos
 </p>
 </div>
 ) : (
 <Select
 placeholder="Escolha um plano"
 selectedKeys={selectedPriceId ? [selectedPriceId] : []}
 onSelectionChange={(keys) => {
 const key = Array.from(keys)[0] as string;
 setSelectedPriceId(key);
 }}
 isDisabled={isGenerating}
 classNames={{
 trigger:'bg-default-100 border-[#2a2a3e]',
 value:'text-foreground',
 }}
 >
 {activePrices.map((price) => (
 <SelectItem
 key={price.id}
 value={price.id}
 textValue={`${formatPrice(price.unitAmount, price.currency)} / ${formatInterval(price.interval, price.intervalCount)}`}
 >
 <div className="flex items-center gap-2">
 <DollarSign className="w-4 h-4 text-muted-foreground" />
 <span className="font-medium">
 {formatPrice(price.unitAmount, price.currency)}
 </span>
 <span className="text-sm text-muted-foreground">
 / {formatInterval(price.interval, price.intervalCount)}
 </span>
 </div>
 </SelectItem>
 ))}
 </Select>
 )}
 </div>

 <Input
 type="email"
 label="Email do cliente"
 placeholder="cliente@exemplo.com"
 value={customerEmail}
 onValueChange={setCustomerEmail}
 isRequired
 isDisabled={isGenerating}
 classNames={{ inputWrapper:'bg-default-100 border-[#2a2a3e]' }}
 />

 <Input
 label="Nome do cliente (opcional)"
 placeholder="João Silva"
 value={customerName}
 onValueChange={setCustomerName}
 isDisabled={isGenerating}
 classNames={{ inputWrapper:'bg-default-100 border-[#2a2a3e]' }}
 />
 </>
 )}
 </ModalBody>

 <ModalFooter>
 <Button variant="flat" onPress={handleClose} isDisabled={isGenerating}>
 {checkoutUrl ?'Fechar' :'Cancelar'}
 </Button>
 {!checkoutUrl && (
 <Button
 color="primary"
 type="submit"
 isLoading={isGenerating}
 isDisabled={!selectedPriceId || !customerEmail || activePrices.length === 0}
 startContent={!isGenerating && <Link className="w-4 h-4" />}
 >
 {isGenerating ?'Gerando...' :'Gerar Link'}
 </Button>
 )}
 </ModalFooter>
 </form>
 </ModalContent>
 </Modal>
 );
}
