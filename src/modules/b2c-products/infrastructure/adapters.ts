/**
 * B2C Products — Infrastructure Adapters
 *
 * Ports the former `common/services/b2c-products-service.ts` into this module.
 * Every exported name and signature is preserved unchanged so consuming hooks
 * (now under `src/shared/hooks/b2c-products/` and `src/shared/hooks/payments/`)
 * only need their import path updated.
 *
 * Backend module: `b2c-products`. Generated typed clients live in
 * `src/infraestructure/server/services/{admin-bc-products,admin-bc-fee-config,
 * bc-products,public-bc-products}` (OpenAPI tags "Admin B2C Products",
 * "Admin B2C Fee Config", "B2C Products", "Public B2C Products" — codegen
 * slugified "B2C" to "Bc"). They are NOT delegated to here because, after
 * inspecting all four:
 *   - every mutation/query response type in the generated clients is `unknown`
 *     (no structural overlap with the `Product` / `B2CFeeConfig` / `B2CCategory`
 *     domain types this module returns), so delegating would require an unsafe
 *     cast at every call site with no behavioral gain;
 *   - `admin-bc-products`'s generated `CreateProductBody` (`CreateB2CProductDTO`)
 *     is missing fields the hand-written `CreateB2CProductDto` sends today
 *     (`billingMode`, `priceName`, `maxBillingCycles`, `accessDurationDays`);
 *   - `admin-bc-products`'s generated `calculateCost(id)` posts with NO body,
 *     dropping the optional `priceId` the original `calculateProductCost`
 *     sends — a real behavior loss;
 *   - `bc-products` (tag "B2C Products") hits a differently-scoped resource
 *     (`/products`, `/products/{id}/calculate-cost` — no `/b2c` prefix) than
 *     the admin-facing `/b2c/products/...` endpoints this service targets;
 *   - `public-bc-products` hits the unauthenticated storefront endpoints
 *     (`/public/b2c/products/...`), not the tenant-scoped admin endpoints used
 *     here via `cmsApiClient`/`apiClient` with auth+tenant headers.
 * Delegating to any of the four would silently change the request shape or
 * response typing, so this adapter keeps the original implementation verbatim.
 * All URL paths, HTTP clients (`apiClient` vs `cmsApiClient`), and payloads
 * below match the pre-migration service exactly.
 */

import { apiClient, cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  Product,
  B2CFeeConfig,
  B2CCategory,
} from "@/src/shared/domain/types/@b2c-products";

// Modos de billing do backend
type BackendBillingMode = "unlimited" | "limited" | "one_time" | "one_time_exp";

export interface CreateB2CProductDto {
  name: string;
  description?: string;
  slug: string;
  priceName: string;
  categories?: string[];
  requiresShipping?: boolean;
  billingMode: BackendBillingMode;
  interval?: "month" | "year" | "quarter" | "week" | "day";
  intervalCount?: number;
  unitAmount: number;
  currency: string;
  maxBillingCycles?: number;
  accessDurationDays?: number;
}

export interface UpdateProductFeesDto {
  categoryId?: string | null;
  chipCostOverride?: number | null;
  shippingFeeOverride?: number | null;
  requiresShipping?: boolean;
}

export const b2cProductsService = {
  async listProducts(): Promise<Product[]> {
    const response = await cmsApiClient.get<Product[]>("/b2c/products");
    return response.data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const response = await cmsApiClient.get<Product>(`/b2c/products/${slug}`);
    return response.data;
  },

  async createProduct(data: CreateB2CProductDto): Promise<Product> {
    const response = await apiClient.post<Product>("/b2c/products", data);
    return response.data;
  },

  async updateProductFees(
    productId: string,
    data: UpdateProductFeesDto,
  ): Promise<Product> {
    const response = await apiClient.patch<Product>(
      `/b2c/fees/products/${productId}`,
      data,
    );
    return response.data;
  },

  async calculateProductCost(
    productId: string,
    priceId?: string,
  ): Promise<{
    basePrice: number;
    chipCostAmount: number;
    shippingFee: number;
    total: number;
    currency: string;
    chipCostPercent: number;
    chipCostSource: "product" | "category" | "global" | "none";
    shippingFeeSource: "product" | "category" | "global" | "none";
    requiresShipping: boolean;
  }> {
    const response = await cmsApiClient.post(
      `/b2c/products/${productId}/calculate-cost`,
      priceId ? { priceId } : {},
    );
    return response.data;
  },

  // ── Fee Config ──────────────────────────────────────────────────────────────

  async getGlobalFees(): Promise<B2CFeeConfig | null> {
    const response = await cmsApiClient.get<B2CFeeConfig | null>(
      "/b2c/fees/global",
    );
    return response.data;
  },

  async upsertGlobalFees(data: {
    chipCostPercent: number;
    shippingFee: number;
  }): Promise<B2CFeeConfig> {
    const response = await apiClient.put<B2CFeeConfig>(
      "/b2c/fees/global",
      data,
    );
    return response.data;
  },

  // ── Categories ──────────────────────────────────────────────────────────────

  async listCategories(): Promise<B2CCategory[]> {
    const response = await cmsApiClient.get<B2CCategory[]>(
      "/b2c/fees/categories",
    );
    return response.data;
  },

  async createCategory(data: {
    name: string;
    slug: string;
    chipCostPercent?: number | null;
    shippingFee?: number | null;
  }): Promise<B2CCategory> {
    const response = await apiClient.post<B2CCategory>(
      "/b2c/fees/categories",
      data,
    );
    return response.data;
  },

  async updateCategory(
    id: string,
    data: {
      name?: string;
      chipCostPercent?: number | null;
      shippingFee?: number | null;
      active?: boolean;
    },
  ): Promise<B2CCategory> {
    const response = await apiClient.patch<B2CCategory>(
      `/b2c/fees/categories/${id}`,
      data,
    );
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/b2c/fees/categories/${id}`);
  },
};
