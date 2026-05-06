// B2C Products and Subscriptions Types

export interface ProductPrice {
  id: string;
  stripePriceId: string;
  interval: 'month' | 'year' | 'week' | 'day';
  intervalCount: number;
  unitAmount: number;
  currency: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  stripeProductId: string;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  prices: ProductPrice[];
  // Fees & shipping
  categoryId?: string | null;
  requiresShipping?: boolean;
  chipCostOverride?: number | null;
  shippingFeeOverride?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface B2CFeeConfig {
  id: string;
  tenantId: string;
  chipCostPercent: number;
  shippingFee: number;
  createdAt: string;
  updatedAt: string;
}

export interface B2CCategory {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  chipCostPercent: number | null;
  shippingFee: number | null;
  active: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  productId: string;
  stripeSubscriptionId: string;
  stripePriceId: string;
  status: 'active' | 'trialing' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  amount: number;
  currency: string;
  studentEmail?: string;
  productName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionMetrics {
  totalActive: number;
  mrr: number;
  churnRate: number;
  newSubscribers: number;
  topProducts: Array<{
    productName: string;
    count: number;
  }>;
}
