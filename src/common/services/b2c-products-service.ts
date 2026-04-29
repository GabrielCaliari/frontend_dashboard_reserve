import { apiClient, cmsApiClient } from '@/src/common/config/api';
import type { Product } from '@/src/common/@types/@b2c-products';

export interface CreateB2CProductDto {
  name: string;
  description?: string;
  slug: string;
  interval: 'month' | 'year' | 'quarter' | 'week';
  intervalCount: number;
  unitAmount: number; // em centavos
  currency: string;
}

export const b2cProductsService = {
  /**
   * Lista todos os produtos ativos com seus preços.
   * Usa cmsApiClient para não disparar redirect global em 401
   * (endpoint pode não estar disponível em todos os tenants).
   */
  async listProducts(): Promise<Product[]> {
    const response = await cmsApiClient.get<Product[]>('/products');
    return response.data;
  },

  /**
   * Obtém um produto específico por slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await cmsApiClient.get<Product>(`/products/${slug}`);
    return response.data;
  },

  /**
   * Cria um novo produto recorrente (B2C)
   */
  async createProduct(data: CreateB2CProductDto): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },
};
