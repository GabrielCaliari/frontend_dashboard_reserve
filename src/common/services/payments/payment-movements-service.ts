import { cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  PaymentMovement,
  PaymentMovementsResponse,
  ListMovementsParams,
  MovementStatus,
  MovementType,
} from "@/src/shared/domain/types/@payment-movements";

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
