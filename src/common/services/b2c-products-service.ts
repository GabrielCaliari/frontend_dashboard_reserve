import { apiClient, cmsApiClient } from '@/src/common/config/api';
import type { Product } from '@/src/common/@types/@b2c-products';

// Modos de billing do backend
type BackendBillingMode = 'unlimited' | 'limited' | 'one_time' | 'one_time_exp';

export interface CreateB2CProductDto {
  name: string;
  description?: string;
  slug: string;
  priceName: string; // NOVO: Nome do preço (exibido no checkout)
  categories?: string[]; // NOVO: Categorias do produto
  billingMode: BackendBillingMode; // NOVO: Modo de cobrança
  interval?: 'month' | 'year' | 'quarter' | 'week' | 'day'; // Opcional para one_time
  intervalCount?: number; // Opcional para one_time
  unitAmount: number; // em centavos
  currency: string;
  // Campos específicos por modo
  maxBillingCycles?: number; // Apenas para 'limited'
  accessDurationDays?: number; // Apenas para 'one_time_exp'
}

export const b2cProductsService = {
  async listProducts(): Promise<Product[]> {
    const response = await cmsApiClient.get<Product[]>('/b2c/products');
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await cmsApiClient.get<Product>(`/b2c/products/${slug}`);
    return response.data;
  },

  async createProduct(data: CreateB2CProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/b2c/products', data);
    return response.data;
  },
};
