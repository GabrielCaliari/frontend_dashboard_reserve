import { apiClient, cmsApiClient } from "@/src/common/config/api";
import type {
  DiscountCoupon,
  CouponListResponse,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponPayload,
  CouponValidationResult,
  CouponLinkResponse,
} from "@/src/shared/domain/types/@coupons";

export const couponsService = {
  /**
   * Lista cupons paginados.
   * Usa cmsApiClient para não disparar redirect global em 401.
   */
  async list(params?: {
    page?: number;
    limit?: number;
  }): Promise<CouponListResponse> {
    const response = await cmsApiClient.get<CouponListResponse>(
      "/admin/coupons",
      { params },
    );
    return response.data;
  },

  /**
   * Obtém um cupom por ID.
   */
  async getById(id: string): Promise<DiscountCoupon> {
    const response = await cmsApiClient.get<DiscountCoupon>(
      `/admin/coupons/${id}`,
    );
    return response.data;
  },

  /**
   * Cria um novo cupom.
   */
  async create(data: CreateCouponPayload): Promise<DiscountCoupon> {
    const response = await apiClient.post<DiscountCoupon>(
      "/admin/coupons",
      data,
    );
    return response.data;
  },

  /**
   * Atualiza um cupom existente.
   * Nota: code, discountType e scope NÃO podem ser alterados.
   */
  async update(id: string, data: UpdateCouponPayload): Promise<DiscountCoupon> {
    const response = await apiClient.put<DiscountCoupon>(
      `/admin/coupons/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * Desativa um cupom (soft-delete).
   */
  async deactivate(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `/admin/coupons/${id}`,
    );
    return response.data;
  },

  /**
   * Valida cupons para feedback de UX no carrinho.
   * ATENÇÃO: usar apenas para UX — o backend recalcula no checkout.
   */
  async validate(data: ValidateCouponPayload): Promise<CouponValidationResult> {
    const response = await cmsApiClient.post<CouponValidationResult>(
      "/public/coupons/validate",
      data,
    );
    return response.data;
  },

  /**
   * Gera o link de compartilhamento do cupom.
   * Se baseUrl não for passado, o backend usa o FRONTEND_URL do .env.
   */
  async getLink(id: string, baseUrl?: string): Promise<CouponLinkResponse> {
    const response = await cmsApiClient.get<CouponLinkResponse>(
      `/admin/coupons/${id}/link`,
      { params: baseUrl ? { baseUrl } : undefined },
    );
    return response.data;
  },
};
