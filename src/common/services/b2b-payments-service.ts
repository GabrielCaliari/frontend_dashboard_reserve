import { apiClient, cmsApiClient } from '@/src/common/config/api';
import type {
  B2BProduct,
  B2BPurchase,
  B2BMetrics,
  PurchaseStatus,
} from '@/src/common/@types/@b2b-payments';

export const b2bPaymentsService = {
  /**
   * Lista todos os produtos B2B (one-time payment).
   * Usa cmsApiClient para não disparar redirect global em 401.
   */
  async listProducts(): Promise<B2BProduct[]> {
    const response = await cmsApiClient.get<B2BProduct[]>('/b2b/payments/products');
    return response.data;
  },

  /**
   * Cria um novo produto B2B
   */
  async createProduct(data: {
    name: string;
    description: string;
    slug: string;
    price: number;
    currency: string;
    categories?: string[];
    requiresShipping?: boolean;
  }): Promise<B2BProduct> {
    const response = await apiClient.post<B2BProduct>('/b2b/payments/products', data);
    return response.data;
  },

  /**
   * Obtém um produto específico por slug
   */
  async getProductBySlug(slug: string): Promise<B2BProduct> {
    const response = await cmsApiClient.get<B2BProduct>(`/b2b/payments/products/${slug}`);
    return response.data;
  },

  /**
   * Lista todas as compras (funil de vendas).
   * Usa cmsApiClient para não disparar redirect global em 401.
   */
  async listPurchases(params?: {
    status?: PurchaseStatus | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{ data: B2BPurchase[]; total: number; limit: number; offset: number }> {
    const response = await cmsApiClient.get('/b2b/payments/purchases', { params });
    return response.data;
  },

  /**
   * Obtém detalhes de uma compra específica
   */
  async getPurchase(id: string): Promise<B2BPurchase> {
    const response = await cmsApiClient.get<B2BPurchase>(`/b2b/payments/purchases/${id}`);
    return response.data;
  },

  /**
   * Gera link de checkout Stripe para um cliente (B2B one-time)
   */
  async createCheckoutLink(data: {
    productId: string;
    customerEmail: string;
    customerName?: string;
    customerPhone?: string;
  }): Promise<{ checkoutUrl: string; purchaseId: string }> {
    const response = await apiClient.post<{ checkoutUrl: string; purchaseId: string }>(
      '/b2b/payments/create-link',
      data
    );
    return response.data;
  },
  async getMetrics(): Promise<B2BMetrics> {
    const response = await cmsApiClient.get<B2BMetrics>('/b2b/payments/metrics');
    return response.data;
  },

  async updateProductFees(productId: string, data: {
    categoryId?: string | null;
    chipCostOverride?: number | null;
    shippingFeeOverride?: number | null;
    requiresShipping?: boolean;
  }): Promise<B2BProduct> {
    const response = await apiClient.patch<B2BProduct>(`/b2b/fees/products/${productId}`, data);
    return response.data;
  },

  async getGlobalFees(): Promise<{ id: string; tenantId: string; chipCostPercent: number; shippingFee: number } | null> {
    const response = await cmsApiClient.get('/b2b/fees/global');
    return response.data;
  },

  async upsertGlobalFees(data: { chipCostPercent: number; shippingFee: number }): Promise<{ id: string; tenantId: string; chipCostPercent: number; shippingFee: number }> {
    const response = await apiClient.put('/b2b/fees/global', data);
    return response.data;
  },

  async calculateProductCost(productId: string): Promise<{
    basePrice: number;
    chipCostAmount: number;
    shippingFee: number;
    total: number;
    currency: string;
    chipCostPercent: number;
    chipCostSource: 'product' | 'category' | 'global' | 'none';
    shippingFeeSource: 'product' | 'category' | 'global' | 'none';
    requiresShipping: boolean;
  }> {
    const response = await cmsApiClient.post(`/b2b/fees/products/${productId}/calculate-cost`, {});
    return response.data;
  },
};
