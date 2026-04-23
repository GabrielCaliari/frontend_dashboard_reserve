/**
 * Payments Types
 * Based on backend API - /payments and /subscriptions endpoints
 */

export type BillingInterval = 'monthly' | 'quarterly' | 'semiannual' | 'annual';
export type BillingCollectionMode = 'upfront' | 'installments';
export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused';

export interface StripePriceIds {
  monthly?: string;
  quarterly?: string;
  semiannual?: string;
  annual?: string;
}

export interface BillingConfigMetadata {
  showAnnualToggle?: boolean;
  highlightPlan?: BillingInterval;
  discountBadge?: string;
  availableIntervals?: BillingInterval[];
  features?: string[];
  [key: string]: unknown;
}

export interface TenantBillingConfig {
  id: string;
  tenantId: string;
  stripePublishableKey?: string;
  hasStripeSecretKey: boolean;
  hasStripeWebhookSecret: boolean;
  stripePriceIds?: StripePriceIds;
  billingInterval: BillingInterval;
  billingCollectionMode: BillingCollectionMode;
  trialEnabled: boolean;
  trialDays?: number;
  currency?: string;
  planName?: string;
  planDescription?: string;
  metadata?: BillingConfigMetadata;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillingConfigDto {
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripePriceIds?: StripePriceIds;
  billingInterval: BillingInterval;
  billingCollectionMode: BillingCollectionMode;
  trialEnabled?: boolean;
  trialDays?: number;
  currency?: string;
  planName?: string;
  planDescription?: string;
  metadata?: BillingConfigMetadata;
}

export interface UpdateBillingConfigDto extends Partial<CreateBillingConfigDto> {
  active?: boolean;
}

export interface Subscription {
  id: string;
  tenantId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  stripeProductId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart: string | null;
  trialEnd: string | null;
  canceledAt: string | null;
  cancelAtPeriodEnd: boolean;
  amount: number;
  formattedAmount: number;
  currency: string;
  interval: string;
  intervalCount: number;
  daysRemaining: number;
  isActive: boolean;
  isInTrial: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GetSubscriptionResponse {
  message?: string;
  subscription: Subscription | null;
  // Backend may return the subscription object directly without wrapper
  id?: string;
}

export interface CreateCheckoutSessionDto {
  tenantId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  trialPeriodDays?: number;
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface CancelSubscriptionDto {
  cancelImmediately: boolean;
}

export interface CancelSubscriptionResponse {
  message: string;
  cancelAtPeriodEnd: boolean;
  accessUntil: string;
}
