// Coupon types — aligned with backend_api_zarp-admin branch 001-feat-coupons
// All monetary values are in cents (integer)

export type EDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type ECouponScope = 'ORDER' | 'PRODUCT' | 'CATEGORY';
export type ECouponAppliesTo = 'b2b' | 'b2c' | 'both';

export interface DiscountCoupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  discountType: EDiscountType;
  discountValue: number;
  scope: ECouponScope;
  productIds: string[];
  categoryIds: string[];
  appliesTo: ECouponAppliesTo;
  cumulative: boolean;
  minOrderAmount: number | null;   // cents
  maxDiscountAmount: number | null; // cents
  maxRedemptions: number | null;
  redeemedCount: number;
  expiresAt: string | null; // ISO 8601
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListResponse {
  data: DiscountCoupon[];
  meta: { page: number; limit: number; total: number };
}

export interface CreateCouponPayload {
  code: string;
  name: string;
  description?: string;
  discountType: EDiscountType;
  discountValue: number;
  scope: ECouponScope;
  productIds?: string[];
  categoryIds?: string[];
  appliesTo: ECouponAppliesTo;
  cumulative?: boolean;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

export interface UpdateCouponPayload {
  name?: string;
  description?: string;
  discountValue?: number;
  productIds?: string[];
  categoryIds?: string[];
  appliesTo?: ECouponAppliesTo;
  cumulative?: boolean;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
  active?: boolean;
}

export interface ValidateCouponPayload {
  codes: string[];
  cartItems: {
    productId: string;
    categoryId?: string;
    basePrice: number; // cents
    quantity: number;
  }[];
  context: 'b2b' | 'b2c';
}

export interface CouponLineResult {
  code: string;
  discountAmount: number; // cents
  description: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupons: CouponLineResult[];
  totalDiscount: number; // cents
  orderTotal: number;   // cents
  finalTotal: number;   // cents
}
