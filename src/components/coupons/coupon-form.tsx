"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
} from "@heroui/react";
import { Info } from "lucide-react";
import type {
  DiscountCoupon,
  CreateCouponPayload,
  UpdateCouponPayload,
  EDiscountType,
  ECouponScope,
  ECouponAppliesTo,
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CouponFormProps {
  initialData?: DiscountCoupon;
  isSubmitting: boolean;
  onSubmit: (payload: CreateCouponPayload | UpdateCouponPayload) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function CouponForm({ initialData, isSubmitting, onSubmit }: CouponFormProps) {
  const isEditMode = !!initialData;

  // ── Data loaders ──────────────────────────────────────────────────────────
  const { data: b2bProducts = [], isLoading: loadingB2B } = useListB2BProducts();
  const { data: b2cProducts = [], isLoading: loadingB2C } = useListB2CProducts();
  const { data: categories = [], isLoading: loadingCats } = useListB2CCategories();

  const activeB2BProducts = b2bProducts.filter((p) => p.active);
  const activeB2CProducts = b2cProducts.filter((p) => p.active);
  const activeCategories = categories.filter((c) => c.active);

  // ── Form ──────────────────────────────────────────────────────────────────
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
        maxRedemptions:
          initialData.maxRedemptions !== null ? String(initialData.maxRedemptions) : "",
        expiresAt: initialData.expiresAt
          ? new Date(initialData.expiresAt).toISOString().slice(0, 16)
          : "",
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
      const payload: UpdateCouponPayload = {
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
      };
      return payload;
    }

    const payload: CreateCouponPayload = {
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
    };
    return payload;
  }

  const inputClass = "bg-[#0d0d20] border-gray-700 text-gray-100";
  const lockedTooltip = "Não é possível alterar após a criação";

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(buildPayload(v)))} className="space-y-6">
      {/* ── Code + Name ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? lockedTooltip : undefined} isDisabled={!isEditMode}>
          <div>
            <Input
              label="Código do Cupom"
              placeholder="EX: PROMO10"
              isDisabled={isEditMode}
              isInvalid={!!errors.code}
              errorMessage={errors.code?.message}
              classNames={{ input: "uppercase", inputWrapper: inputClass }}
              {...register("code", {
                required: !isEditMode ? "Código obrigatório" : false,
              })}
            />
          </div>
        </Tooltip>

        <Input
          label="Nome"
          placeholder="10% de desconto"
          isInvalid={!!errors.name}
          errorMessage={errors.name?.message}
          classNames={{ inputWrapper: inputClass }}
          {...register("name", { required: "Nome obrigatório" })}
        />
      </div>

      {/* ── Description ──────────────────────────────────────────────── */}
      <Textarea
        label="Descrição (opcional)"
        placeholder="Desconto válido até dezembro..."
        classNames={{ inputWrapper: inputClass }}
        {...register("description")}
      />

      {/* ── Discount type + value ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? lockedTooltip : undefined} isDisabled={!isEditMode}>
          <div>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select
                  label="Tipo de Desconto"
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as EDiscountType;
                    field.onChange(val);
                  }}
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="percentage">Percentual (%)</SelectItem>
                  <SelectItem key="fixed_amount">Valor fixo (R$)</SelectItem>
                </Select>
              )}
            />
          </div>
        </Tooltip>

        <Input
          label={discountType === "percentage" ? "Valor (%)" : "Valor (R$)"}
          placeholder={discountType === "percentage" ? "10" : "50.00"}
          type="number"
          step={discountType === "percentage" ? "1" : "0.01"}
          min="0"
          max={discountType === "percentage" ? "100" : undefined}
          isInvalid={!!errors.discountValue}
          errorMessage={errors.discountValue?.message}
          classNames={{ inputWrapper: inputClass }}
          {...register("discountValue", {
            required: "Valor obrigatório",
            validate: (v) => {
              const n = parseFloat(v);
              if (isNaN(n) || n < 0) return "Valor inválido";
              if (discountType === "percentage" && n > 100) return "Máximo 100%";
              return true;
            },
          })}
        />
      </div>

      {/* ── Scope + Applies to ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Tooltip content={isEditMode ? lockedTooltip : undefined} isDisabled={!isEditMode}>
          <div>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <Select
                  label="Escopo"
                  isDisabled={isEditMode}
                  selectedKeys={new Set([field.value])}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] as ECouponScope;
                    field.onChange(val);
                  }}
                  classNames={{ trigger: inputClass }}
                >
                  <SelectItem key="order">Todo o pedido</SelectItem>
                  <SelectItem key="product">Produtos específicos</SelectItem>
                  <SelectItem key="category">Categorias específicas</SelectItem>
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
              label="Aplica a"
              selectedKeys={new Set([field.value])}
              onSelectionChange={(keys) => {
                const val = Array.from(keys)[0] as ECouponAppliesTo;
                field.onChange(val);
              }}
              classNames={{ trigger: inputClass }}
            >
              <SelectItem key="both">Ambos (B2B + B2C)</SelectItem>
              <SelectItem key="b2b">Apenas B2B</SelectItem>
              <SelectItem key="b2c">Apenas B2C</SelectItem>
              <SelectItem key="b2c_recurring">B2C (Apenas Assinaturas)</SelectItem>
              <SelectItem key="b2c_one_time">B2C (Apenas Compra Única)</SelectItem>
            </Select>
          )}
        />
      </div>

      {/* ── Product picker (scope === PRODUCT) ───────────────────────── */}
      {scope === "product" && (
        <div>
          {loadingB2B || loadingB2C ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Spinner size="sm" /> Carregando produtos…
            </div>
          ) : (
            <Controller
              name="productIds"
              control={control}
              render={({ field }) => (
                <Select
                  label="Produtos (selecione um ou mais)"
                  placeholder="Buscar produto…"
                  selectionMode="multiple"
                  selectedKeys={field.value}
                  onSelectionChange={(keys) => field.onChange(new Set(keys as Set<string>))}
                  classNames={{ trigger: inputClass }}
                  isVirtualized
                >
                  {activeB2BProducts.length > 0 && (
                    <SelectSection title="B2B">
                      {activeB2BProducts.map((p) => (
                        <SelectItem key={p.id} textValue={p.name}>
                          <span className="text-sm">{p.name}</span>
                          <span className="ml-2 text-xs text-gray-500">
                            R$ {(p.price / 100).toFixed(2)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectSection>
                  )}
                  {activeB2CProducts.length > 0 && (
                    <SelectSection title="B2C">
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
              <Info className="w-3 h-3" /> Selecione ao menos um produto para restringir o cupom.
            </p>
          )}
        </div>
      )}

      {/* ── Category picker (scope === CATEGORY) ─────────────────────── */}
      {scope === "category" && (
        <div>
          {loadingCats ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Spinner size="sm" /> Carregando categorias…
            </div>
          ) : activeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">
              Nenhuma categoria ativa encontrada. Crie categorias em Produtos {">"} Taxas.
            </p>
          ) : (
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <Select
                  label="Categorias (selecione uma ou mais)"
                  placeholder="Buscar categoria…"
                  selectionMode="multiple"
                  selectedKeys={field.value}
                  onSelectionChange={(keys) => field.onChange(new Set(keys as Set<string>))}
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

      {/* ── Min order + max discount ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Valor mínimo do pedido (R$)"
          placeholder="50.00"
          type="number"
          step="0.01"
          min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={<span className="text-gray-500 text-sm">R$</span>}
          {...register("minOrderAmount")}
        />
        <Input
          label="Desconto máximo (R$)"
          placeholder="200.00"
          type="number"
          step="0.01"
          min="0"
          classNames={{ inputWrapper: inputClass }}
          startContent={<span className="text-gray-500 text-sm">R$</span>}
          {...register("maxDiscountAmount")}
        />
      </div>

      {/* ── Max redemptions + expires at ──────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Limite de resgates (vazio = ilimitado)"
          placeholder="100"
          type="number"
          min="1"
          step="1"
          classNames={{ inputWrapper: inputClass }}
          {...register("maxRedemptions", {
            validate: (v) => {
              if (!v) return true;
              const n = parseInt(v);
              return n > 0 || "Deve ser maior que zero";
            },
          })}
        />
        <Input
          label="Expiração"
          type="datetime-local"
          classNames={{ inputWrapper: inputClass }}
          {...register("expiresAt")}
        />
      </div>

      {/* ── Switches ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-6 pt-2">
        <Controller
          name="cumulative"
          control={control}
          render={({ field }) => (
            <Switch
              isSelected={field.value}
              onValueChange={field.onChange}
              size="sm"
              classNames={{ label: "text-gray-300 text-sm" }}
            >
              Cumulativo (acumula com outros cupons)
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
                classNames={{ label: "text-gray-300 text-sm" }}
              >
                Cupom ativo
              </Switch>
            )}
          />
        )}
      </div>

      {/* ── Submit ────────────────────────────────────────────────────── */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          color="primary"
          isLoading={isSubmitting}
          className="min-w-[140px]"
        >
          {isEditMode ? "Salvar alterações" : "Criar cupom"}
        </Button>
      </div>
    </form>
  );
}
