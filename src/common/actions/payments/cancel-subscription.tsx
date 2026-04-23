'use server';

import { cancelSubscriptionService } from '@/src/common/services/payments/subscriptions-service';
import type { CancelSubscriptionDto, CancelSubscriptionResponse } from '@/src/common/@types/@payments';

export async function cancelSubscriptionAction(
  subscriptionId: string,
  data: CancelSubscriptionDto
): Promise<CancelSubscriptionResponse> {
  try {
    return await cancelSubscriptionService(subscriptionId, data);
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    throw new Error(error?.response?.data?.message || 'Failed to cancel subscription');
  }
}
