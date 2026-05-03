'use server';

import { deleteBillingConfigService } from '@/src/common/services/payments/billing-config-service';

export async function deleteBillingConfigAction(): Promise<void> {
  try {
    await deleteBillingConfigService();
  } catch (error: any) {
    console.error('Error deleting billing config:', error);
    throw new Error(error?.response?.data?.message || 'Failed to delete billing config');
  }
}
