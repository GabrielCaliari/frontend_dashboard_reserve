'use server';

import { createPlanService } from '@/src/common/services/payments/plans-service';
import { getTenantIdFromCookie } from '@/src/common/utils/get-tenant-id-server';
import type { CreateStripePlanDto, StripePlan } from '@/src/common/@types/@payments';

// tenant_id is injected server-side — callers don't need to pass it
type CreatePlanInput = Omit<CreateStripePlanDto, 'tenant_id'>;

export async function createPlanAction(data: CreatePlanInput): Promise<StripePlan> {
  try {
    const tenantId = await getTenantIdFromCookie();

    if (!tenantId) {
      throw new Error('Nenhum tenant selecionado. Selecione um tenant antes de criar um plano.');
    }

    return await createPlanService({ ...data, tenant_id: tenantId });
  } catch (error: any) {
    console.error('Error creating plan:', error);
    const message =
      error?.response?.data?.message || error?.message || 'Failed to create plan';
    throw new Error(message);
  }
}
