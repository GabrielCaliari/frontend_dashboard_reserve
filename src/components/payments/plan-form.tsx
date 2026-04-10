"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  Switch,
} from "@heroui/react";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useCreatePlan } from "@/src/common/hooks/payments/use-create-plan";
import { useUpdatePlan } from "@/src/common/hooks/payments/use-update-plan";
import type {
  StripePlan,
  PlanBillingInterval,
  PlanCurrency,
} from "@/src/shared/domain/types/@payments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function displayToCents(display: string): number {
  const cleaned = display.replace(/[^\d,]/g, "");
  return Math.round(parseFloat(cleaned.replace(",", ".")) * 100);
}

function formatCurrencyInput(value: string, currency: string): string {
  // Remove tudo exceto dígitos
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";

  // Converte para número (em centavos)
  const cents = parseInt(digits, 10);
  const reais = cents / 100;

  // Formata com vírgula
  const formatted = reais.toFixed(2).replace(".", ",");

  // Adiciona símbolo da moeda
  const symbol = currency === "brl" ? "R$" : "US$";
  return symbol + formatted;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PlanFormProps {
  existing?: StripePlan;
  onSuccess: () => void;
  onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PlanForm({ existing, onSuccess, onCancel }: PlanFormProps) {
  const t = useTranslations("payments.planForm");
  const tCommon = useTranslations("common");
  const isEditing = !!existing;
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  // Build schema inside component so t() is available for messages
  const planSchema = z.object({
    slug: z
      .string()
      .min(1, t("slugRequired"))
      .max(100)
      .regex(/^[a-z0-9-]+$/, t("slugPattern")),
    plan_name: z.string().min(1, t("nameRequired")),
    description: z.string().optional(),
    price_display: z
      .string()
      .min(1, t("priceRequired"))
      .refine(
        (v) => {
          const cleaned = v.replace(/[^\d,]/g, "");
          const normalized = cleaned.replace(",", ".");
          return !isNaN(parseFloat(normalized)) && parseFloat(normalized) >= 0;
        },
        { message: t("priceInvalid") },
      ),
    currency: z.enum(["brl", "usd"]),
    billing_interval: z.coerce.number().min(1).max(4),
    has_trial: z.boolean(),
    trial_days: z.coerce.number().min(0).optional(),
    credits_released_trial_period: z.coerce.number().min(0).optional(),
  });

  type PlanFormValues = z.infer<typeof planSchema>;

  const BILLING_INTERVAL_OPTIONS = [
    { value: "1", label: t("intervalWeekly") },
    { value: "2", label: t("intervalMonthly") },
    { value: "3", label: t("intervalQuarterly") },
    { value: "4", label: t("intervalAnnual") },
  ];

  const CURRENCY_OPTIONS = [
    { value: "brl", label: t("currencyBrl") },
    { value: "usd", label: t("currencyUsd") },
  ];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      slug: existing?.slug ?? "",
      plan_name: existing?.plan_name ?? "",
      description: existing?.description ?? "",
      price_display: existing ? centsToDisplay(existing.unit_amount) : "",
      currency: (existing?.currency as PlanCurrency) ?? "brl",
      billing_interval: existing?.billing_interval ?? 2,
      has_trial: existing ? existing.trial_days > 0 : false,
      trial_days: existing?.trial_days ?? 7,
      credits_released_trial_period:
        existing?.credits_released_trial_period ?? 0,
    },
  });

  const hasTrial = watch("has_trial");
  const planName = watch("plan_name");

  // Auto-generate slug from plan_name when creating
  useEffect(() => {
    if (!isEditing && planName) {
      const slug = planName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  }, [planName, isEditing, setValue]);

  const onSubmit = async (values: PlanFormValues) => {
    try {
      if (isEditing && existing) {
        await updatePlan.mutateAsync({
          id: existing.id,
          data: {
            plan_name: values.plan_name,
            description: values.description || undefined,
            credits_released_trial_period: hasTrial
              ? values.credits_released_trial_period
              : 0,
            trial_days: hasTrial ? values.trial_days : 0,
          },
        });
        toast.success(t("updateSuccess"));
      } else {
        await createPlan.mutateAsync({
          slug: values.slug,
          plan_name: values.plan_name,
          description: values.description || undefined,
          unit_amount: displayToCents(values.price_display),
          currency: values.currency as PlanCurrency,
          billing_interval: values.billing_interval as PlanBillingInterval,
          released_credits: 0, // Default value
          guest_limit: 0, // Default value
          credits_released_trial_period: hasTrial
            ? values.credits_released_trial_period
            : undefined,
          trial_days: hasTrial ? values.trial_days : undefined,
        });
        toast.success(t("createSuccess"));
      }
      onSuccess();
    } catch (error: any) {
      const msg = error?.message || t("saveError");
      if (msg.includes("already exists") || msg.includes("slug")) {
        toast.error(t("slugInUse"));
      } else {
        toast.error(msg);
      }
    }
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name + Slug */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t("planName")}
          placeholder={t("planNamePlaceholder")}
          isInvalid={!!errors.plan_name}
          errorMessage={errors.plan_name?.message}
          classNames={{ inputWrapper: "bg-default-100 border-[#2a2a3e]" }}
          {...register("plan_name")}
        />
        <Input
          label={t("slug")}
          placeholder="ex: profissional"
          description={t("slugDesc")}
          isInvalid={!!errors.slug}
          errorMessage={errors.slug?.message}
          isDisabled={isEditing}
          classNames={{ inputWrapper: "bg-default-100 border-[#2a2a3e]" }}
          {...register("slug")}
        />
      </div>

      {/* Description */}
      <Textarea
        label={t("description")}
        placeholder={t("descriptionPlaceholder")}
        minRows={2}
        classNames={{ inputWrapper: "bg-default-100 border-[#2a2a3e]" }}
        {...register("description")}
      />

      {/* Price + Currency + Interval — only on create */}
      {!isEditing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Controller
            name="price_display"
            control={control}
            render={({ field }) => (
              <Input
                label={t("price")}
                placeholder="0,00"
                value={field.value}
                onValueChange={(value) => {
                  const formatted = formatCurrencyInput(
                    value,
                    watch("currency"),
                  );
                  field.onChange(formatted);
                }}
                isInvalid={!!errors.price_display}
                errorMessage={errors.price_display?.message}
                classNames={{ inputWrapper: "bg-default-100 border-[#2a2a3e]" }}
              />
            )}
          />
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                label={t("currency")}
                selectedKeys={[field.value]}
                onSelectionChange={(keys) =>
                  field.onChange(Array.from(keys)[0])
                }
                classNames={{ trigger: "bg-default-100 border-[#2a2a3e]" }}
              >
                {CURRENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value}>{opt.label}</SelectItem>
                ))}
              </Select>
            )}
          />
          <Controller
            name="billing_interval"
            control={control}
            render={({ field }) => (
              <Select
                label={t("billingInterval")}
                selectedKeys={[String(field.value)]}
                onSelectionChange={(keys) =>
                  field.onChange(Number(Array.from(keys)[0]))
                }
                classNames={{ trigger: "bg-default-100 border-[#2a2a3e]" }}
              >
                {BILLING_INTERVAL_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value}>{opt.label}</SelectItem>
                ))}
              </Select>
            )}
          />
        </div>
      )}

      {/* Trial toggle */}
      <div className="p-4 rounded-xl bg-default-100 border border-[#2a2a3e] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("trialTitle")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("trialDesc")}
            </p>
          </div>
          <Controller
            name="has_trial"
            control={control}
            render={({ field }) => (
              <Switch
                isSelected={field.value}
                onValueChange={field.onChange}
                size="sm"
                color="primary"
              />
            )}
          />
        </div>

        {hasTrial && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <Input
              type="number"
              label={t("trialDays")}
              placeholder="7"
              min={1}
              classNames={{ inputWrapper: "bg-background border-[#2a2a3e]" }}
              {...register("trial_days")}
            />
            <Input
              type="number"
              label={t("trialCredits")}
              placeholder="20"
              min={0}
              classNames={{ inputWrapper: "bg-background border-[#2a2a3e]" }}
              {...register("credits_released_trial_period")}
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-1">
        {onCancel && (
          <Button variant="flat" onPress={onCancel} isDisabled={isPending}>
            {tCommon("cancel")}
          </Button>
        )}
        <Button color="primary" type="submit" isLoading={isPending}>
          {isEditing ? t("save") : t("create")}
        </Button>
      </div>
    </form>
  );
}
