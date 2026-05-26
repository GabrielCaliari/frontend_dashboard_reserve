"use client";

import { useForm } from"react-hook-form";
import { zodResolver } from"@hookform/resolvers/zod";
import { z } from"zod";
import { Button, Input, Textarea, Divider } from"@heroui/react";
import { toast } from"react-hot-toast";
import { useTranslations } from"next-intl";
import { useCreateBillingConfig } from"@/src/common/hooks/payments/use-create-billing-config";
import { useUpdateBillingConfig } from"@/src/common/hooks/payments/use-update-billing-config";
import type { TenantBillingConfig } from"@/src/common/@types/@payments";

const billingConfigSchema = z.object({
 stripePublishableKey: z.string().optional(),
 stripeSecretKey: z.string().optional(),
 stripeWebhookSecret: z.string().optional(),
 planName: z.string().optional(),
 planDescription: z.string().optional(),
});

type BillingConfigFormValues = z.infer<typeof billingConfigSchema>;

interface BillingConfigFormProps {
 existing?: TenantBillingConfig | null;
 onSuccess?: () => void;
 onCancel?: () => void;
}

export function BillingConfigForm({ existing, onSuccess, onCancel }: BillingConfigFormProps) {
 const t = useTranslations("payments.billingConfig");
 const isEditing = !!existing;
 const createConfig = useCreateBillingConfig();
 const updateConfig = useUpdateBillingConfig();

 const {
 register,
 handleSubmit,
 formState: { errors },
 } = useForm<BillingConfigFormValues>({
 resolver: zodResolver(billingConfigSchema),
 defaultValues: {
 planName: existing?.planName ??"",
 planDescription: existing?.planDescription ??"",
 // Stripe keys: never pre-fill — user must type them explicitly
 stripePublishableKey:"",
 stripeSecretKey:"",
 stripeWebhookSecret:"",
 },
 });

 const onSubmit = async (values: BillingConfigFormValues) => {
 const payload = {
 // Billing interval/mode are required by the API — keep existing or use defaults
 billingInterval: existing?.billingInterval ??"monthly",
 billingCollectionMode: existing?.billingCollectionMode ??"upfront",
 trialEnabled: existing?.trialEnabled ?? false,
 trialDays: existing?.trialDays,
 planName: values.planName || undefined,
 planDescription: values.planDescription || undefined,
 // Only send keys if user actually typed something
 stripePublishableKey: values.stripePublishableKey || undefined,
 stripeSecretKey: values.stripeSecretKey || undefined,
 stripeWebhookSecret: values.stripeWebhookSecret || undefined,
 };

 try {
 if (isEditing) {
 await updateConfig.mutateAsync(payload);
 toast.success(t("updateSuccess"));
 } else {
 await createConfig.mutateAsync(payload);
 toast.success(t("createSuccess"));
 }
 onSuccess?.();
 } catch (error: any) {
 toast.error(error?.message || t("createError"));
 }
 };

 const isLoading = createConfig.isPending || updateConfig.isPending;

 return (
 <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-6">
 {/* Plan Info */}
 <div className="space-y-4">
 <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
 {t("sectionPlanInfo")}
 </h3>
 <Input
 label={t("planName")}
 placeholder={t("planNamePlaceholder")}
 {...register("planName")}
 isInvalid={!!errors.planName}
 errorMessage={errors.planName?.message}
 classNames={{ input:"bg-transparent", inputWrapper:"bg-default-100 border-[#2a2a3e]" }}
 />
 <Textarea
 label={t("planDescription")}
 placeholder={t("planDescriptionPlaceholder")}
 {...register("planDescription")}
 classNames={{ input:"bg-transparent", inputWrapper:"bg-default-100 border-[#2a2a3e]" }}
 />
 </div>

 <Divider className="bg-[#2a2a3e]" />

 {/* Stripe Keys */}
 <div className="space-y-4">
 <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
 {t("sectionStripeKeys")}
 </h3>
 {isEditing && (
 <p className="text-xs text-muted-foreground">{t("secretKeyHint")}</p>
 )}
 <Input
 label={t("stripePublishableKey")}
 placeholder="pk_test_51... / pk_live_51..."
 autoComplete="off"
 {...register("stripePublishableKey")}
 classNames={{ input:"bg-transparent", inputWrapper:"bg-default-100 border-[#2a2a3e]" }}
 />
 <Input
 label={t("stripeSecretKey")}
 placeholder="sk_test_51... / sk_live_51..."
 type="password"
 autoComplete="new-password"
 {...register("stripeSecretKey")}
 description={isEditing && existing?.hasStripeSecretKey ? t("secretKeyConfigured") : undefined}
 classNames={{ input:"bg-transparent", inputWrapper:"bg-default-100 border-[#2a2a3e]" }}
 />
 <Input
 label={t("stripeWebhookSecret")}
 placeholder="whsec_..."
 type="password"
 autoComplete="new-password"
 {...register("stripeWebhookSecret")}
 description={isEditing && existing?.hasStripeWebhookSecret ? t("webhookConfigured") : undefined}
 classNames={{ input:"bg-transparent", inputWrapper:"bg-default-100 border-[#2a2a3e]" }}
 />
 </div>

 {/* Actions */}
 <div className="flex justify-end gap-3 pt-2">
 {onCancel && (
 <Button variant="flat" onPress={onCancel} isDisabled={isLoading}>
 {t("cancel")}
 </Button>
 )}
 <Button type="submit" color="primary" isLoading={isLoading}>
 {isEditing ? t("saveChanges") : t("createConfig")}
 </Button>
 </div>
 </form>
 );
}
