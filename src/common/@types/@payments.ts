/**
 * Payments Types
 * Based on backend API - /payments, /subscriptions and /plans endpoints
 */

// ─── Plans (Stripe Products) ──────────────────────────────────────────────────

export type PlanBillingInterval = 1 | 2 | 3 | 4; // 1=weekly 2=monthly 3=quarterly 4=annual
export type PlanCurrency = 'brl' | 'usd';

export interface StripePlan {
  id: string;
  slug: string;
  plan_name: string;
  description?: string | null;
  stripe_product_id: string;
  stripe_price_id: string;
  stripe_trial_price_id?: string | null;
  billing_interval: PlanBillingInterval;
  unit_amount: number; // in cents
  currency: PlanCurrency;
  released_credits: number;
  credits_released_trial_period: number;
  guest_limit: number;
  trial_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStripePlanDto {
  tenant_id: string;
  slug: string;
  plan_name: string;
  description?: string;
  unit_amount: number; // in cents
  currency: PlanCurrency;
  billing_interval: PlanBillingInterval;
  released_credits: number;
  guest_limit: number;
  credits_released_trial_period?: number;
  trial_days?: number;
}

export interface UpdateStripePlanDto {
  plan_name?: string;
  description?: string;
  credits_released_trial_period?: number;
  trial_days?: number;
}

export interface ArchivePlanResponse {
  archived: boolean;
}

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
