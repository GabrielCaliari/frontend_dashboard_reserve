"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Input, Textarea, Select, SelectItem, SelectSection,
  Switch, Button, Tooltip, Spinner,
} from "@heroui/react";
import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  DiscountCoupon, CreateCouponPayload, UpdateCouponPayload,
  EDiscountType, ECouponScope, ECouponAppliesTo,
} from "@/src/common/@types/@coupons";
import { useListB2BProducts } from "@/src/common/hooks/useB2BPayments";
import { useListB2CProducts, useListB2CCategories } from "@/src/common/hooks/useB2CProducts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function centsToInputStr(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}

function inputStrToCents(value: string): number | undefined {
  const num = parseFloat(value.replace(",", "."));
  if (isNaN(num)) return undefined;
  return Math.round(num * 100);
}

// ---------------------------------------------------------------------------
// Form values
// ---------------------------------------------------------------------------
interface CouponFormValues {
  code: string;
  name: string;
  description: string;
  discountType: EDiscountType;
  discountValue: string;
  scope: ECouponScope;
  productIds: Set<string>;
  categoryIds: Set<string>;
  appliesTo: ECouponAppliesTo;
  cumulative: boolean;
  minOrderAmount: string;
  maxDiscountAmount: string;
  maxRedemptions: string;
  expiresAt: string;
  active: boolean;
}

interface CouponFormProps {
  initialData?: DiscountCoupon;
  isSubmitting: boolean;
  onSubmit: (payload: CreateCouponPayload | UpdateCouponPayload) => Promise<void>;
}

export function CouponForm({ initialData, isSubmitting, onSubmit }: CouponFormProps) {
  const t = useTranslations("coupons");
  const isEditMode = !!initialData;

  const { data: b2bProducts = [], isLoading: loadingB2B } = useListB2BProducts();
  const { data: b2cProducts = [], isLoading: loadingB2C } = useListB2CProducts();
  const { data: categories = [], isLoading: loadingCats } = useListB2CCategories();

  const activeB2BProducts = b2bProducts.filter((p) => p.active);
  const activeB2CProducts = b2cProducts.filter((p) => p.active);
  const activeCategories = categories.filter((c) => c.active);

  const { register, control, handleSubmit, watch, reset, formState: { errors } } = useForm<CouponFormValues>({
    defaultValues: {
      code: "", name: "", description: "",
      discountType: "percentage", discountValue: "",
      scope: "order",
      productIds: new Set<string>(), categoryIds: new Set<string>(),
      appliesTo: "both", cumulative: false,
      minOrderAmount: "", maxDiscountAmount: "", maxRedemptions: "",
      expiresAt: "", active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        code: initialData.code,
        name: initialData.name,
        description: initialData.description ?? "",
        discountType: initialData.discountType,
        discountValue: String(initialData.discountValue),
        scope: initialData.scope,
        productIds: new Set(initialData.productIds),
        categoryIds: new Set(initialData.categoryIds),
        appliesTo: initialData.appliesTo,
        cumulative: initialData.cumulative,
        minOrderAmount: centsToInputStr(initialData.minOrderAmount),
        maxDiscountAmount: centsToInputStr(initialData.maxDiscountAmount),
        maxRedemptions: initialData.maxRedemptions !== null ? String(initialData.maxRedemptions) : "",
        expiresAt: initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().slice(0, 16) : "",
        active: initialData.active,
      });
    }
  }, [initialData, reset]);

  const discountType = watch("discountType");
  const scope = watch("scope");

  function buildPayload(values: CouponFormValues): CreateCouponPayload | UpdateCouponPayload {
    const discountValue = parseFloat(values.discountValue);
    const productIds = Array.from(values.productIds);
    const categoryIds = Array.from(values.categoryIds);

    if (isEditMode) {
      return {
        name: values.name,
        description: values.description || undefined,
        discountValue,
        productIds,
        categoryIds,
        appliesTo: values.appliesTo,
        cumulative: values.cumulative,
        minOrderAmount: inputStrToCents(values.minOrderAmount) ?? null,
        maxDiscountAmount: inputStrToCents(values.maxDiscountAmount) ?? null,
        maxRedemptions: values.maxRedemptions ? parseInt(values.maxRedemptions) : null,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : null,
        active: values.active,
      } as UpdateCouponPayload;
    }

    return {
      code: values.code.toUpperCase(),
      name: values.name,
      description: values.description || undefined,
      discountType: values.discountType,
      discountValue,
      scope: values.scope,
      productIds: productIds.length ? productIds : undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      appliesTo: values.appliesTo,
      cumulative: values.cumulative,
      minOrderAmount: inputStrToCents(values.minOrderAmount),
      maxDiscountAmount: inputStrToCents(values.maxDiscountAmount),
      maxRedemptions: values.maxRedemptions ? parseInt(values.maxRedemptions) : undefined,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
    } as CreateCouponPayload;
  }

  const inputClass = "bg-[#0d0d20] border-gray-700 text-gray-100";

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(buildPayload(v)))} className="space-y-6">
      {/* Code + Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? t("formCodeLocked") : undefined} isDisabled={!isEditMode}>
          <div>
            <Input
              label={t("formCodeLabel")}
              placeholder={t("formCodePlaceholder")}
              isDisabled={isEditMode}
              isInvalid={!!errors.code}
              errorMessage={errors.code?.message}
              classNames={{ input: "uppercase", inputWrapper: inputClass }}
              {...register("code", { required: !isEditMode ? t("formCodeRequired") : false })}
            />
          </div>
        </Tooltip>

        <Input
          label={t("formNameLabel")}
          placeholder={t("formNamePlaceholder")}
          isInvalid={!!errors.name}
          errorMessage={errors.name?.message}
          classNames={{ inputWrapper: inputClass }}
          {...register("name", { required: t("formNameRequired") })}
        />
      </div>

      {/* Description */}
      <Textarea
        label={t("formDescriptionLabel")}
        placeholder={t("formDescriptionPlaceholder")}
        classNames={{ inputWrapper: inputClass }}
        {...register("description")}
      />

      {/* Discount type + value */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? t("formDiscountTypeLocked") : undefined} isDisabled={!isEditMode}>
          <div>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formDiscountTypeLabel")}
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] as EDiscountType)}
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="percentage">{t("formDiscountTypePercentage")}</SelectItem>
                  <SelectItem key="fixed_amount">{t("formDiscountTypeFixed")}</SelectItem>
                </Select>
              )}
            />
          </div>
        </Tooltip>

        <Input
          label={discountType === "percentage" ? t("formDiscountValuePercent") : t("formDiscountValueFixed")}
          placeholder={discountType === "percentage" ? "10" : "50.00"}
          type="number"
          step={discountType === "percentage" ? "1" : "0.01"}
          min="0"
          max={discountType === "percentage" ? "100" : undefined}
          isInvalid={!!errors.discountValue}
          errorMessage={errors.discountValue?.message}
          classNames={{ inputWrapper: inputClass }}
          {...register("discountValue", {
            required: t("formDiscountValueRequired"),
            validate: (v) => {
              const n = parseFloat(v);
              if (isNaN(n) || n < 0) return t("formDiscountValueInvalid");
              if (discountType === "percentage" && n > 100) return t("formDiscountValueMax");
              return true;
            },
          })}
        />
      </div>

      {/* Scope + Applies to */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? t("formScopeLocked") : undefined} isDisabled={!isEditMode}>
          <div>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formScopeLabel")}
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] as ECouponScope)}
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="order">{t("formScopeOrder")}</SelectItem>
                  <SelectItem key="product">{t("formScopeProduct")}</SelectItem>
                  <SelectItem key="category">{t("formScopeCategory")}</SelectItem>
                </Select>
              )}
            />
          </div>
        </Tooltip>

        <Controller
          name="appliesTo"
          control={control}
          render={({ field }) => (
            <Select
              label={t("formAppliesToLabel")}
              selectedKeys={new Set([field.value])}
              onSelectionChange={(keys) => field.onChange(Array.from(keys)[0] as ECouponAppliesTo)}
              classNames={{ trigger: inputClass }}
            >
              <SelectItem key="both">{t("formAppliesToBoth")}</SelectItem>
              <SelectItem key="b2b">{t("formAppliesToB2B")}</SelectItem>
              <SelectItem key="b2c">{t("formAppliesToB2C")}</SelectItem>
              <SelectItem key="b2c_recurring">{t("formAppliesToB2CRecurring")}</SelectItem>
              <SelectItem key="b2c_one_time">{t("formAppliesToB2COneTime")}</SelectItem>
            </Select>
          )}
        />
      </div>

      {/* Product picker */}
      {scope === "product" && (
        <div>
          {loadingB2B || loadingB2C ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Spinner size="sm" /> {t("formLoadingProducts")}
            </div>
          ) : (
            <Controller
              name="productIds"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formProductsLabel")}
                  placeholder={t("formProductsPlaceholder")}
                  selectionMode="multiple"
                  selectedKeys={field.value}
                  onSelectionChange={(keys) => field.onChange(new Set(keys as Set<string>))}
                  classNames={{ trigger: inputClass }}
                  isVirtualized
                >
                  {activeB2BProducts.length > 0 && (
                    <SelectSection title={t("formSectionB2B")}>
                      {activeB2BProducts.map((p) => (
                        <SelectItem key={p.id} textValue={p.name}>
                          <span className="text-sm">{p.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            {(p.price / 100).toFixed(2)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectSection>
                  )}
                  {activeB2CProducts.length > 0 && (
                    <SelectSection title={t("formSectionB2C")}>
                      {activeB2CProducts.map((p) => (
                        <SelectItem key={p.id} textValue={p.name}>
                          <span className="text-sm">{p.name}</span>
                        </SelectItem>
                      ))}
                    </SelectSection>
                  )}
                </Select>
              )}
            />
          )}
          {Array.from(watch("productIds")).length === 0 && scope === "product" && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" /> {t("formProductsHint")}
            </p>
          )}
        </div>
      )}

      {/* Category picker */}
      {scope === "category" && (
        <div>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Spinner size="sm" /> {t("formLoadingCategories")}
            </div>
          ) : activeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">{t("formNoCategoriesFound")}</p>
          ) : (
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formCategoriesLabel")}
                  placeholder={t("formCategoriesPlaceholder")}
                  selectionMode="multiple"
                  selectedKeys={field.value}
                  onSelectionChange={(keys) => field.onChange(new Set(keys as Set<string>))}
                  classNames={{ trigger: inputClass }}
                >
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} textValue={c.name}>{c.name}</SelectItem>
                  ))}
                </Select>
              )}
            />
          )}
        </div>
      )}

      {/* Min order + max discount */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("formMinOrderLabel")}
          placeholder={t("formMinOrderPlaceholder")}
          type="number" step="0.01" min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={<span className="text-gray-500 text-sm">$</span>}
          {...register("minOrderAmount")}
        />
        <Input
          label={t("formMaxDiscountLabel")}
          placeholder={t("formMaxDiscountPlaceholder")}
          type="number" step="0.01" min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={<span className="text-gray-500 text-sm">$</span>}
          {...register("maxDiscountAmount")}
        />
      </div>

      {/* Max redemptions + expires at */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("formMaxRedemptionsLabel")}
          placeholder={t("formMaxRedemptionsPlaceholder")}
          type="number" min="1" step="1"
          classNames={{ inputWrapper: inputClass }}
          {...register("maxRedemptions", {
            validate: (v) => {
              if (!v) return true;
              const n = parseInt(v);
              return n > 0 || t("formMaxRedemptionsMin");
            },
          })}
        />
        <Input
          label={t("formExpiresAtLabel")}
          type="datetime-local"
          classNames={{ inputWrapper: inputClass }}
          {...register("expiresAt")}
        />
      </div>

      {/* Switches */}
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <Controller
          name="cumulative"
          control={control}
          render={({ field }) => (
            <Switch isSelected={field.value} onValueChange={field.onChange} size="sm" classNames={{ label: "text-gray-300 text-sm" }}>
              {t("formCumulativeLabel")}
            </Switch>
          )}
        />
        {isEditMode && (
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch isSelected={field.value} onValueChange={field.onChange} size="sm" color="success" classNames={{ label: "text-gray-300 text-sm" }}>
                {t("formActiveLabel")}
              </Switch>
            )}
          />
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" color="primary" isLoading={isSubmitting} className="min-w-[140px]">
          {isEditMode ? t("formSubmitUpdate") : t("formSubmitCreate")}
        </Button>
      </div>
    </form>
  );
}
