import { useQuery } from '@tanstack/react-query';
import { b2cProductsService } from '@/src/common/services/b2c-products-service';

export function useListB2CProducts() {
  return useQuery({
    queryKey: ['b2c-products'],
    queryFn: () => b2cProductsService.listProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useGetB2CProduct(slug: string) {
  return useQuery({
    queryKey: ['b2c-product', slug],
    queryFn: () => b2cProductsService.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
