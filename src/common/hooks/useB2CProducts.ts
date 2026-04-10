import { useQuery } from "@tanstack/react-query";
import { b2cProductsService } from "@/src/common/services/b2c-products-service";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";

export function useListB2CProducts() {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2c-products"],
    queryFn: () => b2cProductsService.listProducts(),
    enabled: hasTenant,
    staleTime: 0,
    retry: 1,
  });
}

export function useGetB2CProduct(slug: string) {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2c-product", slug],
    queryFn: () => b2cProductsService.getProductBySlug(slug),
    enabled: hasTenant && !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useListB2CCategories() {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["b2c-categories"],
    queryFn: () => b2cProductsService.listCategories(),
    enabled: hasTenant,
    staleTime: 10 * 60 * 1000,
  });
}
