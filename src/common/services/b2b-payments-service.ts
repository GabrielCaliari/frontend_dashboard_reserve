import axios from 'axios';
import type {
  B2BProduct,
  B2BPurchase,
  B2BMetrics,
  PurchaseStatus,
} from '@/src/common/@types/@b2b-payments';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.seudominio.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const b2bPaymentsService = {
  /**
   * Lista todos os produtos B2B (one-time payment)
   */
  async listProducts(): Promise<B2BProduct[]> {
    const response = await apiClient.get<B2BProduct[]>('/b2b/payments/products');
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
  }): Promise<B2BProduct> {
    const response = await apiClient.post<B2BProduct>('/b2b/payments/products', data);
    return response.data;
  },

  /**
   * Obtém um produto específico por slug
   */
  async getProductBySlug(slug: string): Promise<B2BProduct> {
    const response = await apiClient.get<B2BProduct>(`/b2b/payments/products/${slug}`);
    return response.data;
  },

  /**
   * Lista todas as compras (funil de vendas)
   */
  async listPurchases(params?: {
    status?: PurchaseStatus | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{ data: B2BPurchase[]; total: number; limit: number; offset: number }> {
    const response = await apiClient.get('/b2b/payments/purchases', { params });
    return response.data;
  },

  /**
   * Obtém detalhes de uma compra específica
   */
  async getPurchase(id: string): Promise<B2BPurchase> {
    const response = await apiClient.get<B2BPurchase>(`/b2b/payments/purchases/${id}`);
    return response.data;
  },

  /**
   * Obtém métricas do funil de vendas
   */
  async getMetrics(): Promise<B2BMetrics> {
    const response = await apiClient.get<B2BMetrics>('/b2b/payments/metrics');
    return response.data;
  },
};
