import { cmsApiClient } from '@/src/common/config/api';
import type { UserSubscription, SubscriptionMetrics } from '@/src/common/@types/@b2c-products';

export const b2cSubscriptionsService = {
  /**
   * Lista assinaturas B2C via GET /api/subscriptions/movements?source=b2c
   */
  async listSubscriptions(params?: {
    source?: 'b2c' | 'b2b' | 'all';
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserSubscription[]> {
    const response = await cmsApiClient.get<UserSubscription[]>('/subscriptions/movements', {
      params: {
        source: params?.source ?? 'b2c',
        status: params?.status ?? 'all',
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
      },
    });
    return response.data;
  },

  /**
   * Obtém métricas de assinaturas B2C
   * Calculadas localmente a partir dos movimentos enquanto o endpoint dedicado não existe
   */
  async getMetrics(): Promise<SubscriptionMetrics> {
    const subscriptions = await b2cSubscriptionsService.listSubscriptions({ source: 'b2c', status: 'all', limit: 200 });

    const active = subscriptions.filter((s) => s.status === 'active').length;
    const canceled = subscriptions.filter((s) => s.status === 'canceled').length;
    const mrr = subscriptions
      .filter((s) => s.status === 'active')
      .reduce((sum, s) => sum + (s.amount ?? 0), 0);

    return {
      totalActive: active,
      totalCanceled: canceled,
      mrr,
      total: subscriptions.length,
    } as SubscriptionMetrics;
  },

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await cmsApiClient.post(`/subscriptions/b2c/${subscriptionId}/cancel`);
  },
};
