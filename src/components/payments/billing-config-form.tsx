"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
  Divider,
} from "@heroui/react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useCreateBillingConfig } from "@/src/common/hooks/payments/use-create-billing-config";
import { useUpdateBillingConfig } from "@/src/common/hooks/payments/use-update-billing-config";
import type { TenantBillingConfig } from "@/src/common/@types/@payments";

const billingConfigSchema = z.object({
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  priceIdMonthly: z.string().optional(),
  priceIdQuarterly: z.string().optional(),
  priceIdSemiannual: z.string().optional(),
  priceIdAnnual: z.string().optional(),
  billingInterval: z.enum(["monthly", "quarterly", "semiannual", "annual"]),
  billingCollectionMode: z.enum(["upfront", "installments"]),
  trialEnabled: z.boolean().default(false),
  trialDays: z.coerce.number().min(1).optional(),
  currency: z.string().optional(),
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
    control,
    watch,
    formState: { errors },
  } = useForm<BillingConfigFormValues>({
    resolver: zodResolver(billingConfigSchema),
    defaultValues: {
      billingInterval: existing?.billingInterval ?? "monthly",
      billingCollectionMode: existing?.billingCollectionMode ?? "upfront",
      trialEnabled: existing?.trialEnabled ?? false,
      trialDays: existing?.trialDays ?? 7,
      currency: existing?.currency ?? "brl",
      planName: existing?.planName ?? "",
      planDescription: existing?.planDescription ?? "",
      stripePublishableKey: existing?.stripePublishableKey ?? "",
      priceIdMonthly: existing?.stripePriceIds?.monthly ?? "",
      priceIdQuarterly: existing?.stripePriceIds?.quarterly ?? "",
      priceIdSemiannual: existing?.stripePriceIds?.semiannual ?? "",
      priceIdAnnual: existing?.stripePriceIds?.annual ?? "",
    },
  });

  const trialEnabled = watch("trialEnabled");

  const onSubmit = async (values: BillingConfigFormValues) => {
    const stripePriceIds = {
      ...(values.priceIdMonthly ? { monthly: values.priceIdMonthly } : {}),
      ...(values.priceIdQuarterly ? { quarterly: values.priceIdQuarterly } : {}),
      ...(values.priceIdSemiannual ? { semiannual: values.priceIdSemiannual } : {}),
      ...(values.priceIdAnnual ? { annual: values.priceIdAnnual } : {}),
    };

    const payload = {
      billingInterval: values.billingInterval,
      billingCollectionMode: values.billingCollectionMode,
      trialEnabled: values.trialEnabled,
      trialDays: values.trialEnabled ? values.trialDays : undefined,
      currency: values.currency || undefined,
      planName: values.planName || undefined,
      planDescription: values.planDescription || undefined,
      stripePublishableKey: values.stripePublishableKey || undefined,
      stripeSecretKey: values.stripeSecretKey || undefined,
      stripeWebhookSecret: values.stripeWebhookSecret || undefined,
      stripePriceIds: Object.keys(stripePriceIds).length > 0 ? stripePriceIds : undefined,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Plan Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {t("sectionPlanInfo")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("planName")}
            placeholder={t("planNamePlaceholder")}
            {...register("planName")}
            isInvalid={!!errors.planName}
            errorMessage={errors.planName?.message}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
          <Input
            label={t("currency")}
            placeholder="brl"
            {...register("currency")}
            isInvalid={!!errors.currency}
            errorMessage={errors.currency?.message}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
        </div>
        <Textarea
          label={t("planDescription")}
          placeholder={t("planDescriptionPlaceholder")}
          {...register("planDescription")}
          classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
        />
      </div>

      <Divider className="bg-[#2a2a3e]" />

      {/* Billing Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {t("sectionBilling")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="billingInterval"
            control={control}
            render={({ field }) => (
              <Select
                label={t("billingInterval")}
                selectedKeys={[field.value]}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                isInvalid={!!errors.billingInterval}
                errorMessage={errors.billingInterval?.message}
                classNames={{ trigger: "bg-[#1a1a2e] border-[#2a2a3e]" }}
              >
                <SelectItem key="monthly">{t("intervalMonthly")}</SelectItem>
                <SelectItem key="quarterly">{t("intervalQuarterly")}</SelectItem>
                <SelectItem key="semiannual">{t("intervalSemiannual")}</SelectItem>
                <SelectItem key="annual">{t("intervalAnnual")}</SelectItem>
              </Select>
            )}
          />
          <Controller
            name="billingCollectionMode"
            control={control}
            render={({ field }) => (
              <Select
                label={t("billingCollectionMode")}
                selectedKeys={[field.value]}
                onSelectionChange={(keys) => field.onChange(Array.from(keys)[0])}
                isInvalid={!!errors.billingCollectionMode}
                errorMessage={errors.billingCollectionMode?.message}
                classNames={{ trigger: "bg-[#1a1a2e] border-[#2a2a3e]" }}
              >
                <SelectItem key="upfront" description={t("modeUpfrontDesc")}>
                  {t("modeUpfront")}
                </SelectItem>
                <SelectItem key="installments" description={t("modeInstallmentsDesc")}>
                  {t("modeInstallments")}
                </SelectItem>
              </Select>
            )}
          />
        </div>

        {/* Trial */}
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e]">
          <Controller
            name="trialEnabled"
            control={control}
            render={({ field }) => (
              <Switch isSelected={field.value} onValueChange={field.onChange} size="sm">
                <span className="text-sm text-gray-300">{t("trialEnabled")}</span>
              </Switch>
            )}
          />
          {trialEnabled && (
            <Input
              label={t("trialDays")}
              type="number"
              placeholder="7"
              {...register("trialDays")}
              isInvalid={!!errors.trialDays}
              errorMessage={errors.trialDays?.message}
              classNames={{ input: "bg-transparent", inputWrapper: "bg-[#0f0f1a] border-[#2a2a3e]" }}
            />
          )}
        </div>
      </div>

      <Divider className="bg-[#2a2a3e]" />

      {/* Stripe Keys */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {t("sectionStripeKeys")}
        </h3>
        {isEditing && (
          <p className="text-xs text-gray-500">{t("secretKeyHint")}</p>
        )}
        <Input
          label={t("stripePublishableKey")}
          placeholder="pk_live_51..."
          {...register("stripePublishableKey")}
          classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
        />
        <Input
          label={t("stripeSecretKey")}
          placeholder={isEditing ? "••••••••••••••••" : t("stripeSecretKeyPlaceholder")}
          type="password"
          {...register("stripeSecretKey")}
          description={isEditing && existing?.hasStripeSecretKey ? t("secretKeyConfigured") : undefined}
          classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
        />
        <Input
          label={t("stripeWebhookSecret")}
          placeholder={isEditing ? "••••••••••••••••" : t("stripeWebhookSecretPlaceholder")}
          type="password"
          {...register("stripeWebhookSecret")}
          description={isEditing && existing?.hasStripeWebhookSecret ? t("webhookConfigured") : undefined}
          classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
        />
      </div>

      <Divider className="bg-[#2a2a3e]" />

      {/* Price IDs */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          {t("sectionPriceIds")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t("priceIdMonthly")}
            placeholder="price_1ABC..."
            {...register("priceIdMonthly")}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
          <Input
            label={t("priceIdQuarterly")}
            placeholder="price_1DEF..."
            {...register("priceIdQuarterly")}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
          <Input
            label={t("priceIdSemiannual")}
            placeholder="price_1GHI..."
            {...register("priceIdSemiannual")}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
          <Input
            label={t("priceIdAnnual")}
            placeholder="price_1JKL..."
            {...register("priceIdAnnual")}
            classNames={{ input: "bg-transparent", inputWrapper: "bg-[#1a1a2e] border-[#2a2a3e]" }}
          />
        </div>
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
