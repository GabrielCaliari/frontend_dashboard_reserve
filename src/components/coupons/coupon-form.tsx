"use client";

import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import {
  Input,
  Textarea,
  Select,
  SelectItem,
  SelectSection,
  Switch,
  Button,
  Tooltip,
  Spinner,
  Chip,
} from "@heroui/react";
import { Info, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  DiscountCoupon,
  CreateCouponPayload,
  UpdateCouponPayload,
  EDiscountType,
  ECouponScope,
  ECouponAppliesTo,
  ProductOverride,
} from "@/src/shared/domain/types/@coupons";
import { useListB2BProducts } from "@/src/common/hooks/useB2BPayments";
import {
  useListB2CProducts,
  useListB2CCategories,
} from "@/src/common/hooks/useB2CProducts";

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
interface OverrideFormRow {
  productId: string;
  discountType: EDiscountType;
  discountValue: string;
}

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
  productOverrides: OverrideFormRow[];
}

interface CouponFormProps {
  initialData?: DiscountCoupon;
  isSubmitting: boolean;
  onSubmit: (
    payload: CreateCouponPayload | UpdateCouponPayload,
  ) => Promise<void>;
}

export function CouponForm({
  initialData,
  isSubmitting,
  onSubmit,
}: CouponFormProps) {
  const t = useTranslations("coupons");
  const isEditMode = !!initialData;

  const { data: b2bProducts = [], isLoading: loadingB2B } =
    useListB2BProducts();
  const { data: b2cProducts = [], isLoading: loadingB2C } =
    useListB2CProducts();
  const { data: categories = [], isLoading: loadingCats } =
    useListB2CCategories();

  const activeB2BProducts = b2bProducts.filter((p) => p.active);
  const activeB2CProducts = b2cProducts.filter((p) => p.active);
  const activeCategories = categories.filter((c) => c.active);

  const allProducts = [
    ...activeB2BProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
    })),
    ...activeB2CProducts.map((p) => ({
      id: p.id,
      name: p.name,
      price: undefined as number | undefined,
    })),
  ];

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CouponFormValues>({
    defaultValues: {
      code: "",
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      scope: "order",
      productIds: new Set<string>(),
      categoryIds: new Set<string>(),
      appliesTo: "both",
      cumulative: false,
      minOrderAmount: "",
      maxDiscountAmount: "",
      maxRedemptions: "",
      expiresAt: "",
      active: true,
      productOverrides: [],
    },
  });

  const {
    fields: overrideFields,
    append: appendOverride,
    remove: removeOverride,
  } = useFieldArray({
    control,
    name: "productOverrides",
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
        maxRedemptions:
          initialData.maxRedemptions !== null
            ? String(initialData.maxRedemptions)
            : "",
        expiresAt: initialData.expiresAt
          ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
          : "",
        active: initialData.active,
        productOverrides: (initialData.productOverrides ?? []).map((o) => ({
          productId: o.productId,
          discountType: o.discountType,
          discountValue:
            o.discountType === "fixed_amount"
              ? centsToInputStr(o.discountValue)
              : String(o.discountValue),
        })),
      });
    }
  }, [initialData, reset]);

  const discountType = watch("discountType");
  const scope = watch("scope");
  const selectedProductIds = watch("productIds");

  const selectedProducts = allProducts.filter((p) =>
    selectedProductIds.has(p.id),
  );
  const overrideProductIds = new Set(overrideFields.map((f) => f.productId));
  const availableForOverride = selectedProducts.filter(
    (p) => !overrideProductIds.has(p.id),
  );

  function buildPayload(
    values: CouponFormValues,
  ): CreateCouponPayload | UpdateCouponPayload {
    const discountValue = parseFloat(values.discountValue);
    const productIds = Array.from(values.productIds);
    const categoryIds = Array.from(values.categoryIds);

    const productOverrides: ProductOverride[] = values.productOverrides
      .filter((o) => o.productId && o.discountValue)
      .map((o) => ({
        productId: o.productId,
        discountType: o.discountType,
        discountValue:
          o.discountType === "fixed_amount"
            ? (inputStrToCents(o.discountValue) ?? 0)
            : parseFloat(o.discountValue) || 0,
      }));

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
        maxRedemptions: values.maxRedemptions
          ? parseInt(values.maxRedemptions)
          : null,
        expiresAt: values.expiresAt
          ? new Date(values.expiresAt).toISOString()
          : null,
        active: values.active,
        productOverrides: productOverrides.length > 0 ? productOverrides : null,
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
      maxRedemptions: values.maxRedemptions
        ? parseInt(values.maxRedemptions)
        : undefined,
      expiresAt: values.expiresAt
        ? new Date(values.expiresAt).toISOString()
        : undefined,
      productOverrides:
        productOverrides.length > 0 ? productOverrides : undefined,
    } as CreateCouponPayload;
  }

  const inputClass = "bg-[#0d0d20] border-border text-foreground";

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(buildPayload(v)))}
      className="space-y-6"
    >
      {/* Code + Name */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip
          content={isEditMode ? t("formCodeLocked") : undefined}
          isDisabled={!isEditMode}
        >
          <div>
            <Input
              label={t("formCodeLabel")}
              placeholder={t("formCodePlaceholder")}
              isDisabled={isEditMode}
              isInvalid={!!errors.code}
              errorMessage={errors.code?.message}
              classNames={{ input: "uppercase", inputWrapper: inputClass }}
              {...register("code", {
                required: !isEditMode ? t("formCodeRequired") : false,
              })}
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
        <Tooltip
          content={isEditMode ? t("formDiscountTypeLocked") : undefined}
          isDisabled={!isEditMode}
        >
          <div>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formDiscountTypeLabel")}
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) =>
                    field.onChange(Array.from(keys)[0] as EDiscountType)
                  }
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="percentage">
                    {t("formDiscountTypePercentage")}
                  </SelectItem>
                  <SelectItem key="fixed_amount">
                    {t("formDiscountTypeFixed")}
                  </SelectItem>
                </Select>
              )}
            />
          </div>
        </Tooltip>

        <Input
          label={
            discountType === "percentage"
              ? t("formDiscountValuePercent")
              : t("formDiscountValueFixed")
          }
          placeholder={discountType === "percentage" ? "10" : "50.00"}
          type="number"
          step={discountType === "percentage" ? "1" : "0.01"}
          min="0"
          max={discountType === "percentage" ? "100" : undefined}
          isInvalid={!!errors.discountValue}
          errorMessage={errors.discountValue?.message}
          classNames={{ inputWrapper: inputClass }}
          description={
            scope === "product" && overrideFields.length > 0
              ? t("formDiscountValueFallbackHint")
              : undefined
          }
          {...register("discountValue", {
            required: t("formDiscountValueRequired"),
            validate: (v) => {
              const n = parseFloat(v);
              if (isNaN(n) || n < 0) return t("formDiscountValueInvalid");
              if (discountType === "percentage" && n > 100)
                return t("formDiscountValueMax");
              return true;
            },
          })}
        />
      </div>

      {/* Scope + Applies to */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip
          content={isEditMode ? t("formScopeLocked") : undefined}
          isDisabled={!isEditMode}
        >
          <div>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select
                  label={t("formScopeLabel")}
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) =>
                    field.onChange(Array.from(keys)[0] as ECouponScope)
                  }
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="order">{t("formScopeOrder")}</SelectItem>
                  <SelectItem key="product">{t("formScopeProduct")}</SelectItem>
                  <SelectItem key="category">
                    {t("formScopeCategory")}
                  </SelectItem>
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
              onSelectionChange={(keys) =>
                field.onChange(Array.from(keys)[0] as ECouponAppliesTo)
              }
              classNames={{ trigger: inputClass }}
            >
              <SelectItem key="both">{t("formAppliesToBoth")}</SelectItem>
              <SelectItem key="b2b">{t("formAppliesToB2B")}</SelectItem>
              <SelectItem key="b2c">{t("formAppliesToB2C")}</SelectItem>
              <SelectItem key="b2c_recurring">
                {t("formAppliesToB2CRecurring")}
              </SelectItem>
              <SelectItem key="b2c_one_time">
                {t("formAppliesToB2COneTime")}
              </SelectItem>
            </Select>
          )}
        />
      </div>

      {/* Product picker */}
      {scope === "product" && (
        <div className="space-y-4">
          {loadingB2B || loadingB2C ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
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
                  onSelectionChange={(keys) =>
                    field.onChange(new Set(keys as Set<string>))
                  }
                  classNames={{ trigger: inputClass }}
                  isVirtualized
                >
                  {activeB2BProducts.length > 0 && (
                    <SelectSection title={t("formSectionB2B")}>
                      {activeB2BProducts.map((p) => (
                        <SelectItem key={p.id} textValue={p.name}>
                          <span className="text-sm">{p.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
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

          {Array.from(selectedProductIds).length === 0 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" /> {t("formProductsHint")}
            </p>
          )}

          {/* Per-product overrides */}
          {selectedProducts.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("formOverridesTitle")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("formOverridesHint")}
                  </p>
                </div>
                {availableForOverride.length > 0 && (
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Plus className="w-3.5 h-3.5" />}
                    onPress={() =>
                      appendOverride({
                        productId: availableForOverride[0].id,
                        discountType: "fixed_amount",
                        discountValue: "",
                      })
                    }
                  >
                    {t("formOverridesAdd")}
                  </Button>
                )}
              </div>

              {overrideFields.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {t("formOverridesEmpty")}
                </p>
              ) : (
                <div className="space-y-3">
                  {overrideFields.map((field, index) => {
                    const overrideDiscountType = watch(
                      `productOverrides.${index}.discountType`,
                    );
                    const otherOverrideIds = new Set(
                      overrideFields
                        .filter((_, i) => i !== index)
                        .map((f) => f.productId),
                    );
                    const availableForRow = selectedProducts.filter(
                      (p) => !otherOverrideIds.has(p.id),
                    );

                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-[1fr_140px_120px_36px] gap-2 items-end"
                      >
                        <Controller
                          name={`productOverrides.${index}.productId`}
                          control={control}
                          render={({ field: f }) => (
                            <Select
                              size="sm"
                              label={t("formOverridesProduct")}
                              selectedKeys={new Set([f.value])}
                              onSelectionChange={(keys) =>
                                f.onChange(Array.from(keys)[0] as string)
                              }
                              classNames={{ trigger: inputClass }}
                            >
                              {availableForRow.map((p) => (
                                <SelectItem key={p.id} textValue={p.name}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </Select>
                          )}
                        />

                        <Controller
                          name={`productOverrides.${index}.discountType`}
                          control={control}
                          render={({ field: f }) => (
                            <Select
                              size="sm"
                              label={t("formDiscountTypeLabel")}
                              selectedKeys={new Set([f.value])}
                              onSelectionChange={(keys) =>
                                f.onChange(Array.from(keys)[0] as EDiscountType)
                              }
                              classNames={{ trigger: inputClass }}
                            >
                              <SelectItem key="fixed_amount">
                                {t("formDiscountTypeFixed")}
                              </SelectItem>
                              <SelectItem key="percentage">
                                {t("formDiscountTypePercentage")}
                              </SelectItem>
                            </Select>
                          )}
                        />

                        <Input
                          size="sm"
                          label={
                            overrideDiscountType === "percentage"
                              ? t("formDiscountValuePercent")
                              : t("formDiscountValueFixed")
                          }
                          placeholder={
                            overrideDiscountType === "percentage"
                              ? "10"
                              : "40.00"
                          }
                          type="number"
                          step={
                            overrideDiscountType === "percentage" ? "1" : "0.01"
                          }
                          min="0"
                          max={
                            overrideDiscountType === "percentage"
                              ? "100"
                              : undefined
                          }
                          classNames={{ inputWrapper: inputClass }}
                          {...register(
                            `productOverrides.${index}.discountValue`,
                            {
                              required: true,
                              validate: (v) =>
                                !isNaN(parseFloat(v)) && parseFloat(v) > 0,
                            },
                          )}
                        />

                        <Button
                          size="sm"
                          isIconOnly
                          variant="light"
                          color="danger"
                          onPress={() => removeOverride(index)}
                          aria-label="Remove override"
                          className="mb-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {overrideFields.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {overrideFields.map((field, index) => {
                    const prod = allProducts.find(
                      (p) => p.id === field.productId,
                    );
                    const val = watch(
                      `productOverrides.${index}.discountValue`,
                    );
                    const type = watch(
                      `productOverrides.${index}.discountType`,
                    );
                    if (!prod || !val) return null;
                    const label =
                      type === "fixed_amount" ? `$${val}` : `${val}%`;
                    return (
                      <Chip
                        key={field.id}
                        size="sm"
                        variant="flat"
                        color="secondary"
                      >
                        {prod.name}: {label}
                      </Chip>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category picker */}
      {scope === "category" && (
        <div>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Spinner size="sm" /> {t("formLoadingCategories")}
            </div>
          ) : activeCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {t("formNoCategoriesFound")}
            </p>
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
                  onSelectionChange={(keys) =>
                    field.onChange(new Set(keys as Set<string>))
                  }
                  classNames={{ trigger: inputClass }}
                >
                  {activeCategories.map((c) => (
                    <SelectItem key={c.id} textValue={c.name}>
                      {c.name}
                    </SelectItem>
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
          type="number"
          step="0.01"
          min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={
            <span className="text-muted-foreground text-sm">$</span>
          }
          {...register("minOrderAmount")}
        />
        <Input
          label={t("formMaxDiscountLabel")}
          placeholder={t("formMaxDiscountPlaceholder")}
          type="number"
          step="0.01"
          min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={
            <span className="text-muted-foreground text-sm">$</span>
          }
          {...register("maxDiscountAmount")}
        />
      </div>

      {/* Max redemptions + expires at */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t("formMaxRedemptionsLabel")}
          placeholder={t("formMaxRedemptionsPlaceholder")}
          type="number"
          min="1"
          step="1"
          classNames={{ inputWrapper: inputClass }}
          {...register("maxRedemptions", {
            validate: (v) => {
              if (!v) return true;
              const n = parseInt(v);
              return n > 0 || t("formMaxRedemptionsMin");
            },
          })}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm text-muted-foreground px-1">
            {t("formExpiresAtLabel")}
          </label>
          <input
            type="datetime-local"
            className="w-full rounded-xl px-3 py-3 text-sm text-foreground bg-[#0d0d20] border border-border focus:outline-none focus:border-primary transition-colors [color-scheme:dark]"
            {...register("expiresAt")}
          />
        </div>
      </div>

      {/* Switches */}
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <Controller
          name="cumulative"
          control={control}
          render={({ field }) => (
            <Switch
              isSelected={field.value}
              onValueChange={field.onChange}
              size="sm"
              classNames={{ label: "text-foreground text-sm" }}
            >
              {t("formCumulativeLabel")}
            </Switch>
          )}
        />
        {isEditMode && (
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <Switch
                isSelected={field.value}
                onValueChange={field.onChange}
                size="sm"
                color="success"
                classNames={{ label: "text-foreground text-sm" }}
              >
                {t("formActiveLabel")}
              </Switch>
            )}
          />
        )}
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          color="primary"
          isLoading={isSubmitting}
          className="min-w-[140px]"
        >
          {isEditMode ? t("formSubmitUpdate") : t("formSubmitCreate")}
        </Button>
      </div>
    </form>
  );
}
