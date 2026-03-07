'use server';

import { deleteLeadService } from '@/src/common/services/leads/delete-lead-service';

export async function deleteLeadAction(id: string): Promise<{ success: boolean }> {
  try {
    return await deleteLeadService(id);
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    throw new Error(error?.response?.data?.message || 'Failed to delete lead');
  }
}
