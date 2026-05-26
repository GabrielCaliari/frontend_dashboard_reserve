"use client";

import { useState, useEffect } from"react";
import {
 Button,
 Skeleton,
 Modal,
 ModalContent,
 ModalHeader,
 ModalBody,
 ModalFooter,
} from"@heroui/react";
import { toast } from"react-hot-toast";
import { CreditCard, RefreshCw, ExternalLink, AlertTriangle } from"lucide-react";
import { useTranslations } from"next-intl";
import { useSearchParams } from"next/navigation";
import { useSubscription } from"@/src/common/hooks/payments/use-subscription";
import { useBillingConfig } from"@/src/common/hooks/payments/use-billing-config";
import { usePlans } from"@/src/common/hooks/payments/use-plans";
import { useCreateCheckoutSession } from"@/src/common/hooks/payments/use-create-checkout-session";
import { useCancelSubscription } from"@/src/common/hooks/payments/use-cancel-subscription";
import { SubscriptionCard } from"./subscription-card";
import { useTenantStore } from"@/src/common/stores/tenant-store";

export function SubscriptionsSection() {
 const t = useTranslations("payments.subscriptions");
 const searchParams = useSearchParams();
 const [showCancelModal, setShowCancelModal] = useState(false);
 const [cancelImmediately, setCancelImmediately] = useState(false);

 const selectedTenant = useTenantStore((state) => state.selectedTenant);
 const { data: subscriptionData, isLoading: isLoadingSub, refetch } = useSubscription();
 const { data: billingConfig, isLoading: isLoadingConfig } = useBillingConfig();
 const { data: plans = [], isLoading: isLoadingPlans } = usePlans();
 const createCheckout = useCreateCheckoutSession();
 const cancelSubscription = useCancelSubscription();

 const subscription = subscriptionData?.subscription;
 const isLoading = isLoadingSub || isLoadingConfig || isLoadingPlans;

 // Handle return from Stripe checkout
 useEffect(() => {
 const success = searchParams.get('success');
 const canceled = searchParams.get('canceled');

 if (success ==='1') {
 toast.success('Pagamento processado! Aguardando confirmação do Stripe...');
 // Refetch subscription data multiple times to catch webhook processing
 const intervals = [1000, 3000, 5000, 10000]; // 1s, 3s, 5s, 10s
 intervals.forEach((delay) => {
 setTimeout(() => {
 console.log('Refetching subscription data...');
 refetch();
 }, delay);
 });
 
 // Clean URL
 window.history.replaceState({},'','/dashboard/payments/subscriptions');
 } else if (canceled ==='1') {
 toast.error('Pagamento cancelado.');
 window.history.replaceState({},'','/dashboard/payments/subscriptions');
 }
 }, [searchParams, refetch]);

 const handleSubscribe = async (planId?: string) => {
 if (!selectedTenant) {
 toast.error("Nenhum tenant selecionado.");
 return;
 }

 // Get active plans
 const activePlans = plans.filter((p) => p.active);
 
 if (activePlans.length === 0) {
 toast.error("Nenhum plano ativo encontrado. Crie um plano primeiro em Products.");
 return;
 }

 // If planId is provided, use it. Otherwise, use the first active plan
 let selectedPlan = activePlans.find(p => p.id === planId) || activePlans[0];

 // If multiple active plans and no planId specified, prefer matching billing config
 if (!planId && billingConfig && activePlans.length > 1) {
 const intervalMap: Record<string, number> = {'monthly': 2,'quarterly': 3,'annual': 4,
 };
 const preferredInterval = intervalMap[billingConfig.billingInterval];
 const matchingPlan = activePlans.find(p => p.billing_interval === preferredInterval);
 if (matchingPlan) {
 selectedPlan = matchingPlan;
 }
 }

 const priceId = selectedPlan.stripe_price_id;

 if (!priceId) {
 toast.error("O plano selecionado não tem um Price ID válido.");
 return;
 }

 console.log('Creating checkout with:', {
 planName: selectedPlan.plan_name,
 priceId,
 trialDays: selectedPlan.trial_days,
 });

 try {
 const origin = window.location.origin;
 const { checkoutUrl } = await createCheckout.mutateAsync({
 tenantId: selectedTenant.id,
 priceId,
 successUrl:`${origin}/dashboard/payments/subscriptions?success=1`,
 cancelUrl:`${origin}/dashboard/payments/subscriptions?canceled=1`,
 trialPeriodDays: selectedPlan.trial_days > 0 ? selectedPlan.trial_days : undefined,
 });
 window.location.href = checkoutUrl;
 } catch (error: any) {
 console.error('Checkout error:', error);
 const errorMessage = error?.response?.data?.message || error?.message || t("checkoutError");
 toast.error(`Erro ao criar checkout: ${errorMessage}`);
 }
 };

 const handleCancel = async () => {
 if (!subscription) return;
 try {
 const result = await cancelSubscription.mutateAsync({
 subscriptionId: subscription.id,
 data: { cancelImmediately },
 });
 toast.success(
 cancelImmediately
 ? t("cancelSuccessImmediate")
 : t("cancelSuccessPeriodEnd", {
 date: new Date(result.accessUntil).toLocaleDateString("pt-BR"),
 })
 );
 setShowCancelModal(false);
 } catch (error: any) {
 toast.error(error?.message || t("cancelError"));
 }
 };

 if (isLoading) {
 return (
 <div className="space-y-4">
 <Skeleton className="h-8 w-48 rounded-lg" />
 <Skeleton className="h-48 w-full rounded-xl" />
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
 <Button
 size="sm"
 variant="flat"
 isIconOnly
 onPress={() => refetch()}
 aria-label={t("refresh")}
 >
 <RefreshCw className="w-4 h-4" />
 </Button>
 </div>

 {/* No billing config warning */}
 {!billingConfig && (
 <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-950/30 border border-yellow-800/50">
 <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-yellow-300">{t("noBillingConfig")}</p>
 <p className="text-xs text-yellow-400 mt-0.5">{t("noBillingConfigDesc")}</p>
 </div>
 </div>
 )}

 {/* No plans warning */}
 {plans.length === 0 && (
 <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-950/30 border border-yellow-800/50">
 <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
 <div>
 <p className="text-sm font-medium text-yellow-300">Nenhum plano disponível</p>
 <p className="text-xs text-yellow-400 mt-0.5">Crie planos em Products para começar a aceitar assinaturas.</p>
 </div>
 </div>
 )}

 {/* No subscription - Show available plans */}
 {!subscription && plans.length > 0 && (
 <div className="space-y-4">
 <div className="text-center py-6">
 <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
 <CreditCard className="w-7 h-7 text-primary" />
 </div>
 <p className="text-base font-semibold text-foreground">{t("noSubscription")}</p>
 <p className="text-sm text-muted-foreground mt-1">Escolha um plano para começar</p>
 </div>

 {/* Available Plans */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {plans.filter(p => p.active).map((plan) => (
 <div
 key={plan.id}
 className="p-5 rounded-xl border bg-default-100 border-[#2a2a3e] hover:border-primary/50 transition-colors"
 >
 <div className="mb-4">
 <h3 className="text-lg font-semibold text-foreground">{plan.plan_name}</h3>
 {plan.description && (
 <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
 )}
 </div>

 <div className="mb-4">
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-bold text-foreground">
 {new Intl.NumberFormat('pt-BR', {
 style:'currency',
 currency: plan.currency.toUpperCase(),
 }).format(plan.unit_amount / 100)}
 </span>
 <span className="text-sm text-muted-foreground">
 /{plan.billing_interval === 1 ?'semana' : plan.billing_interval === 2 ?'mês' : plan.billing_interval === 3 ?'trimestre' :'ano'}
 </span>
 </div>
 {plan.trial_days > 0 && (
 <p className="text-xs text-green-400 mt-1">
 {plan.trial_days} dias grátis
 </p>
 )}
 </div>

 <div className="space-y-2 mb-4">
 <div className="flex items-center gap-2 text-xs text-foreground">
 <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
 {plan.released_credits} créditos por ciclo
 </div>
 <div className="flex items-center gap-2 text-xs text-foreground">
 <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
 Até {plan.guest_limit} convidados
 </div>
 </div>

 <Button
 color="primary"
 className="w-full"
 startContent={<ExternalLink className="w-4 h-4" />}
 isLoading={createCheckout.isPending}
 onPress={() => handleSubscribe(plan.id)}
 >
 Assinar {plan.plan_name}
 </Button>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* No subscription and no plans */}
 {!subscription && plans.length === 0 && (
 <div className="flex flex-col items-center justify-center py-12 gap-4 rounded-xl bg-default-100 border border-[#2a2a3e]">
 <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
 <CreditCard className="w-7 h-7 text-primary" />
 </div>
 <div className="text-center">
 <p className="text-base font-semibold text-foreground">Nenhum plano disponível</p>
 <p className="text-sm text-muted-foreground mt-1">Crie planos em Products para começar</p>
 </div>
 </div>
 )}

 {/* Active subscription */}
 {subscription && (
 <>
 <SubscriptionCard subscription={subscription} />
 {subscription.isActive && !subscription.cancelAtPeriodEnd && (
 <div className="flex justify-end">
 <Button
 color="danger"
 variant="flat"
 size="sm"
 onPress={() => setShowCancelModal(true)}
 >
 {t("cancelSubscription")}
 </Button>
 </div>
 )}
 </>
 )}

 {/* Cancel Modal */}
 <Modal
 isOpen={showCancelModal}
 onClose={() => setShowCancelModal(false)}
 classNames={{
 base:"bg-background border border-border",
 header:"border-b border-border",
 footer:"border-t border-border",
 }}
 >
 <ModalContent>
 <ModalHeader>
 <h3 className="text-base font-semibold text-foreground">{t("cancelTitle")}</h3>
 </ModalHeader>
 <ModalBody>
 <p className="text-sm text-foreground mb-4">{t("cancelDesc")}</p>
 <div className="space-y-3">
 <button
 type="button"
 onClick={() => setCancelImmediately(false)}
 className={`w-full p-4 rounded-xl border text-left transition-colors ${
 !cancelImmediately
 ?"border-primary bg-primary/10"
 :"border-[#2a2a3e] bg-default-100 hover:border-[#3a3a4e]"
 }`}
 >
 <p className="text-sm font-medium text-foreground">{t("cancelAtPeriodEnd")}</p>
 <p className="text-xs text-muted-foreground mt-0.5">{t("cancelAtPeriodEndDesc")}</p>
 </button>
 <button
 type="button"
 onClick={() => setCancelImmediately(true)}
 className={`w-full p-4 rounded-xl border text-left transition-colors ${
 cancelImmediately
 ?"border-danger bg-danger/10"
 :"border-[#2a2a3e] bg-default-100 hover:border-[#3a3a4e]"
 }`}
 >
 <p className="text-sm font-medium text-foreground">{t("cancelImmediately")}</p>
 <p className="text-xs text-red-400 mt-0.5">{t("cancelImmediatelyDesc")}</p>
 </button>
 </div>
 </ModalBody>
 <ModalFooter>
 <Button
 variant="flat"
 onPress={() => setShowCancelModal(false)}
 isDisabled={cancelSubscription.isPending}
 >
 {t("back")}
 </Button>
 <Button
 color="danger"
 isLoading={cancelSubscription.isPending}
 onPress={handleCancel}
 >
 {t("confirmCancel")}
 </Button>
 </ModalFooter>
 </ModalContent>
 </Modal>
 </div>
 );
}
