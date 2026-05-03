import axios from 'axios';
import type { UserSubscription, SubscriptionMetrics } from '@/src/common/@types/@b2c-products';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.seudominio.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const b2cSubscriptionsService = {
  /**
   * Lista todas as assinaturas ativas
   */
  async listSubscriptions(): Promise<UserSubscription[]> {
    const response = await apiClient.get<UserSubscription[]>('/subscriptions/b2c');
    return response.data;
  },

  /**
   * Obtém métricas de assinaturas
   */
  async getMetrics(): Promise<SubscriptionMetrics> {
    const response = await apiClient.get<SubscriptionMetrics>('/subscriptions/b2c/metrics');
    return response.data;
  },

  /**
   * Cancela uma assinatura
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await apiClient.post(`/subscriptions/b2c/${subscriptionId}/cancel`);
  },
};
