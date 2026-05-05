import { cmsApiClient } from '@/src/common/config/api';
import type {
  PaymentMovement,
  PaymentMovementsResponse,
  ListMovementsParams,
  MovementStatus,
} from '@/src/common/@types/@payment-movements';
import type { UserSubscription } from '@/src/common/@types/@b2c-products';
import type { B2BProduct } from '@/src/common/@types/@b2b-payments';

export const paymentMovementsService = {
  async listMovements(params?: ListMovementsParams): Promise<PaymentMovementsResponse> {
    const results: PaymentMovement[] = [];

    // ── B2B purchases (pagamento único) ──────────────────────────────────────
    if (!params?.type || params.type === 'all' || params.type === 'one_time') {
      try {
        const [purchasesRes, productsRes] = await Promise.allSettled([
          cmsApiClient.get('/b2b/payments/purchases', {
            params: {
              limit: 100,
              offset: 0,
              status: params?.status && params.status !== 'all' ? params.status : undefined,
            },
          }),
          cmsApiClient.get<B2BProduct[]>('/b2b/payments/products'),
        ]);

        // Mapa productId → name para join
        const productMap: Record<string, string> = {};
        if (productsRes.status === 'fulfilled') {
          const prods: B2BProduct[] = Array.isArray(productsRes.value.data)
            ? productsRes.value.data
            : [];
          for (const prod of prods) {
            productMap[prod.id] = prod.name;
          }
        }

        if (purchasesRes.status === 'fulfilled') {
          const raw = purchasesRes.value.data as any;
          const purchases: any[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data)
            ? raw.data
            : [];

          for (const p of purchases) {
            // Detecta modo teste pelo prefixo do checkout ID
            const isTest = p.stripeCheckoutId?.startsWith('cs_test_') ||
              p.stripePaymentIntent?.startsWith('pi_test_') ||
              String(p.stripePaymentIntent ?? '').includes('test');
            const stripeBase = `https://dashboard.stripe.com${isTest ? '/test' : ''}`;

            const stripeLink = p.stripePaymentIntent
              ? `${stripeBase}/payments/${p.stripePaymentIntent}`
              : p.stripeCheckoutId
              ? `${stripeBase}/checkout/sessions/${p.stripeCheckoutId}`
              : null;

            // Produtos vêm em metadata.cart_items (multi-produto) ou legado productId/productName
            const cartItems: any[] = Array.isArray(p.metadata?.cart_items) && p.metadata.cart_items.length > 0
              ? p.metadata.cart_items
              : [];

            const productsArray: Array<{ id: string; name: string }> = cartItems.length > 0
              ? cartItems.map((item: any) => ({
                  id: item.productId ?? '',
                  name: item.productName ?? productMap[item.productId] ?? '—',
                }))
              : p.productId
              ? [{ id: p.productId, name: p.productName ?? productMap[p.productId] ?? '—' }]
              : [];

            const firstProduct = productsArray[0];

            results.push({
              id: p.id,
              type: 'one_time',
              customerEmail: p.customerEmail ?? '',
              customerName: p.customerName,
              customerPhone: p.customerPhone,
              productName: firstProduct?.name ?? p.productName ?? productMap[p.productId] ?? '—',
              productId: firstProduct?.id ?? p.productId,
              products: productsArray.length > 0 ? productsArray : undefined,
              amount: p.amount ?? 0,
              currency: p.currency ?? 'brl',
              status: (p.status ?? 'pending') as MovementStatus,
              stripeCheckoutId: p.stripeCheckoutId,
              stripePaymentIntentId: p.stripePaymentIntent ?? p.stripePaymentIntentId,
              stripeLink,
              completedAt: p.checkoutCompletedAt ?? p.completedAt,
              createdAt: p.checkoutStartedAt ?? p.createdAt,
              updatedAt: p.updatedAt ?? p.createdAt,
            });
          }
        }
      } catch (err: any) {
        console.error('[movements] b2b failed:', err?.response?.status, err?.message);
      }
    }

    // ── B2C subscriptions (recorrente) ───────────────────────────────────────
    if (!params?.type || params.type === 'all' || params.type === 'subscription') {
      try {
        const res = await cmsApiClient.get<UserSubscription[]>('/subscriptions/b2c');
        const subscriptions: UserSubscription[] = Array.isArray(res.data) ? res.data : [];

        for (const s of subscriptions) {
          results.push({
            id: s.id,
            type: 'subscription',
            customerEmail: s.studentEmail ?? '',
            productName: s.productName ?? '—',
            productId: s.productId,
            amount: s.amount ?? 0,
            currency: s.currency ?? 'brl',
            status: s.status as MovementStatus,
            currentPeriodStart: s.currentPeriodStart,
            currentPeriodEnd: s.currentPeriodEnd,
            cancelAtPeriodEnd: s.cancelAtPeriodEnd,
            stripeSubscriptionId: s.stripeSubscriptionId,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          });
        }
      } catch {
        // B2C endpoint not available yet — skip silently
      }
    }

    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      data: results,
      total: results.length,
      limit: params?.limit ?? results.length,
      offset: params?.offset ?? 0,
    };
  },
};
