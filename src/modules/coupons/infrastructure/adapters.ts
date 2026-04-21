import { apiClient, cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  DiscountCoupon,
  CouponListResponse,
  CreateCouponPayload,
  UpdateCouponPayload,
  ValidateCouponPayload,
  CouponValidationResult,
  CouponLinkResponse,
} from "@/src/shared/domain/types/@coupons";

/**
 * Adapter para o domínio `coupons`.
 *
 * NOTA (Task 16): o codegen (`src/infraestructure/server/services/admin-coupons`
 * e `.../public-coupons`) foi inspecionado antes de decidir esta implementação.
 * Optou-se por manter a implementação `apiClient`/`cmsApiClient` verbatim em vez
 * de delegar para o serviço gerado, pelas seguintes divergências estruturais
 * encontradas:
 *
 * 1. Todos os `Response` types gerados são `unknown` (ex.: `ListResponse`,
 *    `GetByIdResponse`, `ValidateResponse`) — delegar perderia a tipagem forte
 *    hoje garantida por `@/src/shared/domain/types/@coupons`.
 * 2. Nomes de método divergentes: gerado usa `remove`/`generateLink`, o código
 *    atual (e os componentes que o consomem) usa `deactivate`/`getLink`.
 * 3. `generateLink` gerado recebe `{ baseUrl?: string }` como `params` de query,
 *    enquanto a assinatura atual é `getLink(id, baseUrl?: string)` — usada assim
 *    pelos componentes (`coupon-link-modal.tsx`).
 * 4. `ValidateCouponDTO` gerado (`public-coupons/types.ts`) tem `context:
 *    'b2b' | 'b2c' | 'unified'` e `cartItems[].itemType`, enquanto o payload
 *    atual (`ValidateCouponPayload`) usa `context: 'b2b' | 'b2c'` sem
 *    `itemType` — shapes incompatíveis sem um mapeamento adicional.
 * 5. O serviço gerado usa `apiClient` para TODAS as chamadas, inclusive `list`.
 *    O código atual usa deliberadamente `cmsApiClient` para `list`, `getById`,
 *    `validate` e `getLink` — ver comentário original abaixo — para evitar o
 *    redirect global em 401 do `apiClient`. Delegar quebraria esse
 *    comportamento.
 *
 * Dado o volume de divergências (tipagem, nomes de método e assinatura, e
 * comportamento de erro), a delegação para o código gerado foi descartada.
 */
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
