import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { b2cProductsService } from "@/src/modules/b2c-products/infrastructure/adapters";
import { b2bPaymentsService } from "@/src/common/services/b2b-payments-service";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";
import { toast } from "react-hot-toast";

// ─── Tipo compartilhado de custo calculado ────────────────────────────────────

export interface CalculatedCost {
  basePrice: number;
  chipCostAmount: number;
  shippingFee: number;
  total: number;
  currency: string;
  chipCostPercent: number;
  chipCostSource: "product" | "category" | "global" | "none";
  shippingFeeSource: "product" | "category" | "global" | "none";
  requiresShipping: boolean;
}

interface ToastMessages {
  success: string;
  error: string;
}

// ─── Taxa global B2C ─────────────────────────────────────────────────────────

export function useGlobalFees() {
  const hasTenant = useHasSelectedTenant();
  return useQuery({
    queryKey: ["b2c-global-fees"],
    queryFn: () => b2cProductsService.getGlobalFees(),
    enabled: hasTenant,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertGlobalFees(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chipCostPercent: number; shippingFee: number }) =>
      b2cProductsService.upsertGlobalFees(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2c-global-fees"] });
      queryClient.invalidateQueries({ queryKey: ["b2c-products"] });
      queryClient.invalidateQueries({
        queryKey: ["b2c-cost"],
        exact: false,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Global fees updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error updating global fees",
      );
    },
  });
}

// ─── Taxa global B2B ─────────────────────────────────────────────────────────

export function useB2BGlobalFees() {
  const hasTenant = useHasSelectedTenant();
  return useQuery({
    queryKey: ["b2b-global-fees"],
    queryFn: () => b2bPaymentsService.getGlobalFees(),
    enabled: hasTenant,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpsertB2BGlobalFees(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { chipCostPercent: number; shippingFee: number }) =>
      b2bPaymentsService.upsertGlobalFees(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b-global-fees"] });
      queryClient.invalidateQueries({ queryKey: ["b2b-products"] });
      queryClient.invalidateQueries({
        queryKey: ["b2b-cost"],
        exact: false,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Global fees updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error updating global fees",
      );
    },
  });
}

// ─── Categorias ───────────────────────────────────────────────────────────────

export function useCategories() {
  const hasTenant = useHasSelectedTenant();
  return useQuery({
    queryKey: ["b2c-categories"],
    queryFn: () => b2cProductsService.listCategories(),
    enabled: hasTenant,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      slug: string;
      chipCostPercent?: number | null;
      shippingFee?: number | null;
    }) => b2cProductsService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2c-categories"] });
      toast.success(messages?.success ?? "Category created");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error creating category",
      );
    },
  });
}

export function useUpdateCategory(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        chipCostPercent?: number | null;
        shippingFee?: number | null;
        active?: boolean;
      };
    }) => b2cProductsService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2c-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["b2c-cost"],
        exact: false,
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["b2b-cost"],
        exact: false,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Category updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error updating category",
      );
    },
  });
}

export function useDeleteCategory(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => b2cProductsService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2c-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["b2c-cost"],
        exact: false,
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["b2b-cost"],
        exact: false,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Category removed");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error removing category",
      );
    },
  });
}

// ─── Fees por produto B2C ─────────────────────────────────────────────────────

export function useUpdateProductFees(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: {
        categoryId?: string | null;
        chipCostOverride?: number | null;
        shippingFeeOverride?: number | null;
        requiresShipping?: boolean;
      };
    }) => b2cProductsService.updateProductFees(productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["b2c-products"] });
      queryClient.invalidateQueries({
        queryKey: ["b2c-cost", variables.productId],
        exact: true,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Product fees updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error updating product fees",
      );
    },
  });
}

// ─── Calculate cost B2C ───────────────────────────────────────────────────────

export function useB2CProductCost(productId: string, enabled = true) {
  const hasTenant = useHasSelectedTenant();
  return useQuery<CalculatedCost>({
    queryKey: ["b2c-cost", productId],
    queryFn: () => b2cProductsService.calculateProductCost(productId),
    enabled: hasTenant && enabled && !!productId,
    staleTime: 30 * 1000,
    retry: false,
  });
}

// ─── Fees por produto B2B ─────────────────────────────────────────────────────

export function useUpdateB2BProductFees(messages?: ToastMessages) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: {
        categoryId?: string | null;
        chipCostOverride?: number | null;
        shippingFeeOverride?: number | null;
        requiresShipping?: boolean;
      };
    }) => b2bPaymentsService.updateProductFees(productId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["b2b-products"] });
      queryClient.invalidateQueries({
        queryKey: ["b2b-cost", variables.productId],
        exact: true,
        refetchType: "all",
      });
      toast.success(messages?.success ?? "Product fees updated");
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          messages?.error ||
          "Error updating product fees",
      );
    },
  });
}

// ─── Calculate cost B2B ───────────────────────────────────────────────────────

export function useB2BProductCost(productId: string, enabled = true) {
  const hasTenant = useHasSelectedTenant();
  return useQuery<CalculatedCost>({
    queryKey: ["b2b-cost", productId],
    queryFn: () => b2bPaymentsService.calculateProductCost(productId),
    enabled: hasTenant && enabled && !!productId,
    staleTime: 30 * 1000,
    retry: false,
  });
}
