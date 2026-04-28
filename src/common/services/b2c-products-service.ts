import axios from 'axios';
import type { Product } from '@/common/@types/@b2c-products';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.seudominio.com/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const b2cProductsService = {
  /**
   * Lista todos os produtos ativos com seus preços
   */
  async listProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  /**
   * Obtém um produto específico por slug
   */
  async getProductBySlug(slug: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${slug}`);
    return response.data;
  },
};
