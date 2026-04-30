/**
 * Payments — Infrastructure Adapters
 *
 * Consolidates the former `common/services/payments/{billing-config,payment-movements,
 * plans,subscriptions}-service.ts` files into a single adapter module. Every exported
 * function/object name and signature is preserved unchanged so consuming hooks (now under
 * `src/shared/hooks/payments/`) and actions (`src/presentation/actions/payments/`) only
 * need their import path updated.
 *
 * Backend module: `reserve-subscriptions`. Kept as domain name "payments" per the
 * documented naming exception in `src/modules/MODULES.md`, not renamed to "subscriptions"
 * to avoid colliding with the separate `b2c-subscriptions` module.
 *
 * Generated typed clients were inspected (Task 11 codegen) at
 * `src/infraestructure/server/services/{plans,subscriptions,payments-billing-config}`
 * before deciding this implementation. Delegation was rejected for all four sub-services,
 * for different reasons in each case — the original `apiClient`/`cmsApiClient`
 * implementations are kept verbatim:
 *
 * 1. `plans-service.ts` → generated `plansService`:
 *    - `updatePlanService(id, data, tenantId)` sends `tenant_id` as a query param on the
 *      PATCH request (backend needs it to resolve the tenant's Stripe secret key).
 *      Generated `adminUpdatePlan(id, body)` accepts NO params argument at all — delegating
 *      would silently drop `tenant_id` and change behavior.
 *    - `archivePlanService`/`deletePlanService` both hit `DELETE /plans/admin/{id}` (the
 *      generated `adminArchivePlan` matches this one), but the generated response type is
 *      `unknown` vs. the domain's typed `ArchivePlanResponse` — delegating loses type
 *      safety. Kept the whole file's four functions verbatim for consistency.
 *
 * 2. `subscriptions-service.ts` → generated `subscriptionsService`:
 *    - `createCheckoutSessionService` (`POST /subscriptions/checkout`) and
 *      `cancelSubscriptionService` (`POST /subscriptions/{id}/cancel`) have NO generated
 *      equivalent whatsoever — the generated service only exposes `listMovements`,
 *      `getTenantSubscription`, and `createBillingPortalSession` (a different endpoint,
 *      `/subscriptions/billing-portal`, not used by this codebase's UI today).
 *    - `getSubscriptionByTenantService` does have a matching generated
 *      `getTenantSubscription(tenantId)` (same URL), but its response type is `unknown`
 *      vs. the domain's typed `GetSubscriptionResponse`. Kept verbatim for consistency.
 *
 * 3. `payment-movements-service.ts` → generated `subscriptionsService.listMovements`:
 *    - The generated client returns the raw backend payload untouched (`unknown`). The
 *      real implementation performs substantial client-side work the generated client does
 *      not do at all: mapping `BackendMovement` → the domain `PaymentMovement` shape
 *      (deriving `type`, building Stripe dashboard deep-links incl. test/live mode
 *      detection, flattening multi-product `cart_items`, field renames), then sorting by
 *      `createdAt` descending. Delegating would require reimplementing all of this on top
 *      of the generated call anyway, with no benefit.
 *    - It also deliberately calls `cmsApiClient` (not `apiClient`) to avoid the global
 *      401-redirect interceptor that only `apiClient` has — the generated service uses
 *      `apiClient` for this call.
 *
 * 4. `billing-config-service.ts` → generated `paymentsBillingConfigService`:
 *    - URLs and verbs match exactly (`GET/POST/PATCH/DELETE /payments/billing-config`), but
 *      the generated response DTO (`TenantBillingConfigResponseDTO`) types several fields
 *      as nullable (`stripePublishableKey: string | null`, `planName: string | null`,
 *      `planDescription: string | null`, `stripePriceIds`/`metadata: Record<string,
 *      unknown> | null`) while the domain type (`TenantBillingConfig`) types the same
 *      fields as optional-undefined with specific shapes (`StripePriceIds`,
 *      `BillingConfigMetadata`). These are not structurally assignable without a mapping
 *      layer, and the generated `delete()` response is `unknown` vs. the original's `void`.
 *      Kept verbatim for consistency with the rest of the module.
 */

import {
  apiClient,
  cmsApiClient,
} from "@/src/infraestructure/axios/api";
import type {
  TenantBillingConfig,
  CreateBillingConfigDto,
  UpdateBillingConfigDto,
  StripePlan,
  CreateStripePlanDto,
  UpdateStripePlanDto,
  ArchivePlanResponse,
  GetSubscriptionResponse,
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
  CancelSubscriptionDto,
  CancelSubscriptionResponse,
} from "@/src/shared/domain/types/@payments";
import type {
  PaymentMovement,
  PaymentMovementsResponse,
  ListMovementsParams,
  MovementStatus,
  MovementType,
} from "@/src/shared/domain/types/@payment-movements";

// ============================================================================
// Billing Config (formerly common/services/payments/billing-config-service.ts)
// ============================================================================

export async function getBillingConfigService(): Promise<TenantBillingConfig> {
  const response = await apiClient.get<TenantBillingConfig>(
    "/payments/billing-config",
  );
  return response.data;
}

export async function createBillingConfigService(
  data: CreateBillingConfigDto,
): Promise<TenantBillingConfig> {
  const response = await apiClient.post<TenantBillingConfig>(
    "/payments/billing-config",
    data,
  );
  return response.data;
}

export async function updateBillingConfigService(
  data: UpdateBillingConfigDto,
): Promise<TenantBillingConfig> {
  const response = await apiClient.patch<TenantBillingConfig>(
    "/payments/billing-config",
    data,
  );
  return response.data;
}

export async function deleteBillingConfigService(): Promise<void> {
  await apiClient.delete("/payments/billing-config");
}

// ============================================================================
// Payment Movements (formerly common/services/payments/payment-movements-service.ts)
// ============================================================================

/**
 * Shape retornada pelo backend em GET /subscriptions/movements
 * (tanto source=all quanto source=b2c ou source=b2b)
 */
interface BackendMovement {
  id: string;
  source: "b2c" | "b2b";
  type?: "subscription" | "one_time";
  status: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  productId?: string;
  productName?: string;
  products?: Array<{ id: string; name: string }>;
  // cart_items (B2B multi-produto)
  metadata?: {
    cart_items?: Array<{ productId: string; productName?: string }>;
  };
  // Subscription fields
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  // One-time fields
  stripeCheckoutId?: string;
  stripePaymentIntent?: string;
  stripePaymentIntentId?: string;
  // Timestamps
  checkoutStartedAt?: string;
  checkoutCompletedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

interface BackendMovementsResponse {
  data: BackendMovement[];
  total: number;
}

function mapMovement(m: BackendMovement): PaymentMovement {
  const type: MovementType =
    m.type === "subscription" || m.source === "b2c"
      ? "subscription"
      : "one_time";

  // Detecta modo teste pelo prefixo do Stripe ID
  const isTest =
    m.stripeCheckoutId?.startsWith("cs_test_") ||
    m.stripePaymentIntent?.startsWith("pi_test_") ||
    String(m.stripePaymentIntent ?? "").includes("test");
  const stripeBase = `https://dashboard.stripe.com${isTest ? "/test" : ""}`;

  const stripeLink = m.stripeSubscriptionId
    ? `${stripeBase}/subscriptions/${m.stripeSubscriptionId}`
    : m.stripePaymentIntent
      ? `${stripeBase}/payments/${m.stripePaymentIntent}`
      : m.stripeCheckoutId
        ? `${stripeBase}/checkout/sessions/${m.stripeCheckoutId}`
        : null;

  // Monta lista de produtos (suporte a cart_items multi-produto)
  const cartItems =
    Array.isArray(m.metadata?.cart_items) && m.metadata!.cart_items!.length > 0
      ? m.metadata!.cart_items!
      : [];

  const products: Array<{ id: string; name: string }> =
    m.products && m.products.length > 0
      ? m.products
      : cartItems.length > 0
        ? cartItems.map((item) => ({
            id: item.productId ?? "",
            name: item.productName ?? "—",
          }))
        : m.productId
          ? [{ id: m.productId, name: m.productName ?? "—" }]
          : [];

  const firstProduct = products[0];

  return {
    id: m.id,
    type,
    customerEmail: m.customerEmail ?? "",
    customerName: m.customerName,
    customerPhone: m.customerPhone,
    productName: firstProduct?.name ?? m.productName ?? "—",
    productId: firstProduct?.id ?? m.productId,
    products: products.length > 0 ? products : undefined,
    amount: m.amount ?? 0,
    currency: m.currency ?? "brl",
    status: (m.status ?? "pending") as MovementStatus,
    stripeLink,
    // Subscription
    currentPeriodStart: m.currentPeriodStart,
    currentPeriodEnd: m.currentPeriodEnd,
    cancelAtPeriodEnd: m.cancelAtPeriodEnd,
    stripeSubscriptionId: m.stripeSubscriptionId,
    // One-time
    stripeCheckoutId: m.stripeCheckoutId,
    stripePaymentIntentId: m.stripePaymentIntent ?? m.stripePaymentIntentId,
    completedAt: m.checkoutCompletedAt ?? m.completedAt,
    createdAt: m.checkoutStartedAt ?? m.createdAt,
    updatedAt: m.updatedAt ?? m.createdAt,
  };
}

export const paymentMovementsService = {
  async listMovements(
    params?: ListMovementsParams,
  ): Promise<PaymentMovementsResponse> {
    // Mapeia o filtro de tipo para o param source do backend
    const source =
      params?.type === "subscription"
        ? "b2c"
        : params?.type === "one_time"
          ? "b2b"
          : "all";

    const queryParams = {
      source,
      status: params?.status && params.status !== "all" ? params.status : "all",
      limit: params?.limit ?? 100,
      offset: params?.offset ?? 0,
    };

    console.log(
      "[movements] request → GET /subscriptions/movements",
      queryParams,
    );

    const res = await cmsApiClient.get<BackendMovementsResponse>(
      "/subscriptions/movements",
      {
        params: queryParams,
      },
    );

    console.log("[movements] response →", res.status, {
      total: res.data?.total,
    });

    const raw: BackendMovement[] = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

    const data = raw.map(mapMovement);

    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      data,
      total: res.data?.total ?? data.length,
      limit: params?.limit ?? data.length,
      offset: params?.offset ?? 0,
    };
  },
};

// ============================================================================
// Plans (formerly common/services/payments/plans-service.ts)
// ============================================================================

export async function listPlansAdminService(): Promise<StripePlan[]> {
  // O tenant_id deve vir do header x-tenant-id (injetado automaticamente pelo interceptor)
  // O backend deve usar o tenant selecionado, não o tenant do admin
  const response = await apiClient.get<StripePlan[]>("/plans/admin/list");
  return response.data;
}

export async function createPlanService(
  data: CreateStripePlanDto,
): Promise<StripePlan> {
  const response = await apiClient.post<StripePlan>(
    "/plans/admin/create",
    data,
  );
  return response.data;
}

export async function updatePlanService(
  id: string,
  data: UpdateStripePlanDto,
  tenantId: string,
): Promise<StripePlan> {
  const response = await apiClient.patch<StripePlan>(
    `/plans/admin/${id}`,
    data,
    {
      params: { tenant_id: tenantId },
    },
  );
  return response.data;
}

export async function archivePlanService(
  id: string,
  tenantId: string,
): Promise<ArchivePlanResponse> {
  const response = await apiClient.delete<ArchivePlanResponse>(
    `/plans/admin/${id}`,
    {
      params: { tenant_id: tenantId },
    },
  );
  return response.data;
}

export async function deletePlanService(
  id: string,
  tenantId: string,
): Promise<void> {
  // Note: The API may not have a separate hard-delete endpoint
  // This uses the same DELETE endpoint as archive, but for already archived plans
  await apiClient.delete(`/plans/admin/${id}`, {
    params: { tenant_id: tenantId },
  });
}

// ============================================================================
// Subscriptions (formerly common/services/payments/subscriptions-service.ts)
// ============================================================================

export async function getSubscriptionByTenantService(
  tenantId: string,
): Promise<GetSubscriptionResponse> {
  const response = await apiClient.get<GetSubscriptionResponse>(
    `/subscriptions/tenant/${tenantId}`,
  );
  return response.data;
}

export async function createCheckoutSessionService(
  data: CreateCheckoutSessionDto,
): Promise<CheckoutSessionResponse> {
  const response = await apiClient.post<CheckoutSessionResponse>(
    "/subscriptions/checkout",
    data,
  );
  return response.data;
}

export async function cancelSubscriptionService(
  subscriptionId: string,
  data: CancelSubscriptionDto,
): Promise<CancelSubscriptionResponse> {
  const response = await apiClient.post<CancelSubscriptionResponse>(
    `/subscriptions/${subscriptionId}/cancel`,
    data,
  );
  return response.data;
}
