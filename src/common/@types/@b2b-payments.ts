// B2B One-Time Payments Types

export interface B2BProduct {
  id: string;
  name: string;
  description: string;
  price: number; // em centavos
  currency: string;
  active: boolean;
  stripeProductId: string;
  stripePriceId: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseStatus = 'pending' | 'completed' | 'abandoned' | 'refunded';

export interface B2BPurchase {
  id: string;
  tenantId: string;
  productId?: string;
  productName?: string;
  products?: Array<{ id: string; name: string; price?: number }>; // multi-produto
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  amount: number; // em centavos
  currency: string;
  status: PurchaseStatus;
  stripeCheckoutId?: string;
  stripePaymentIntentId?: string;
  checkoutStartedAt?: string;
  checkoutCompletedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface B2BMetrics {
  totalPurchases: number;
  totalCompleted: number;
  totalAbandoned: number;
  totalRefunded: number;
  conversionRate: number;
  abandonmentRate: number;
  totalRevenue: number; // em centavos
  averageOrderValue: number; // em centavos
}
