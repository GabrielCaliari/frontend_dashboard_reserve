/**
 * B2C Subscriptions — Infrastructure Adapters
 *
 * Ports the former `common/services/b2c-subscriptions-service.ts` into this module.
 * Function names and signatures are preserved unchanged so the consuming hooks (now
 * under `src/shared/hooks/b2c-subscriptions/`) only need their import path updated.
 *
 * Backend module: `bc-subscriptions` (see the generated client at
 * `src/infraestructure/server/services/bc-subscriptions`). NOT delegated to here:
 *   - The generated client targets a completely different set of endpoints
 *     (`POST /api/subscriptions/checkout`, `POST /api/subscriptions/{id}/cancel`,
 *     `GET /api/subscriptions/my`) via `apiClient`, intended for an end-user checkout
 *     flow. This adapter instead backs the admin-facing B2C subscriptions dashboard,
 *     which lists/aggregates subscriptions via `GET /subscriptions/movements?source=b2c`
 *     and cancels via `POST /subscriptions/b2c/{id}/cancel`, both through `cmsApiClient`
 *     (a distinct base client/URL from `apiClient`).
 *   - The generated response types are `unknown`, with no structural relationship to
 *     the `UserSubscription[]` / `SubscriptionMetrics` domain types this module returns.
 *   - `getMetrics` additionally computes aggregate stats (active/canceled counts, MRR)
 *     client-side from the movements list, since no dedicated metrics endpoint exists
 *     yet — behavior with no generated-client equivalent at all.
 * For these reasons this adapter keeps the original `cmsApiClient`-based implementation
 * verbatim. All URL paths and logic here match the pre-migration service exactly.
 */

import { cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  UserSubscription,
  SubscriptionMetrics,
} from "@/src/shared/domain/types/@b2c-products";

/**
 * Lista assinaturas B2C via GET /api/subscriptions/movements?source=b2c
 */
export const listSubscriptions = async (params?: {
  source?: "b2c" | "b2b" | "all";
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<UserSubscription[]> => {
  const response = await cmsApiClient.get<UserSubscription[]>(
    "/subscriptions/movements",
    {
      params: {
        source: params?.source ?? "b2c",
        status: params?.status ?? "all",
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      },
    },
  );
  return response.data;
};

/**
 * Obtém métricas de assinaturas B2C
 * Calculadas localmente a partir dos movimentos enquanto o endpoint dedicado não existe
 */
export const getMetrics = async (): Promise<SubscriptionMetrics> => {
  const subscriptions = await listSubscriptions({
    source: "b2c",
    status: "all",
    limit: 200,
  });

  const active = subscriptions.filter((s) => s.status === "active").length;
  const canceled = subscriptions.filter(
    (s) => s.status === "canceled",
  ).length;
  const mrr = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return {
    totalActive: active,
    totalCanceled: canceled,
    mrr,
    total: subscriptions.length,
  } as SubscriptionMetrics;
};

/**
 * Cancela uma assinatura
 */
export const cancelSubscription = async (
  subscriptionId: string,
): Promise<void> => {
  await cmsApiClient.post(`/subscriptions/b2c/${subscriptionId}/cancel`);
};
