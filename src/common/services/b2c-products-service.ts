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
