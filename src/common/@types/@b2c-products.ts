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
  createdAt: string;
  updatedAt: string;
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
