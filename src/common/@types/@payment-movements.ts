// Unified payment movements — all Stripe activity in one place

export type MovementType = 'subscription' | 'one_time';
export type MovementStatus =
  | 'completed'
  | 'active'
  | 'pending'
  | 'abandoned'
  | 'canceled'
  | 'refunded'
  | 'trialing'
  | 'past_due'
  | 'incomplete';

export interface PaymentMovement {
  id: string;
  type: MovementType;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  productName: string;       // nome do primeiro produto (retrocompatibilidade)
  productId?: string;        // id do primeiro produto (retrocompatibilidade)
  products?: Array<{ id: string; name: string }>; // todos os produtos da compra
  amount: number; // em centavos
  currency: string;
  status: MovementStatus;
  stripeLink?: string | null; // link direto para o Stripe Dashboard
  // Subscription-specific
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeSubscriptionId?: string;
  // One-time specific
  stripeCheckoutId?: string;
  stripePaymentIntentId?: string;
  completedAt?: string;
  // Common
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMovementsResponse {
  data: PaymentMovement[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListMovementsParams {
  type?: MovementType | 'all';
  status?: MovementStatus | 'all';
  limit?: number;
  offset?: number;
}
