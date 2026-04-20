"use server";

import { updateLeadQualificationService } from "@/src/modules/leads/infrastructure/adapters";

export async function updateLeadQualification(leadId: string, card: string) {
  return updateLeadQualificationService({
    lead_id: leadId,
    card: card,
  });
}
