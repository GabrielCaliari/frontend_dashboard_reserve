"use server";

import { updateLeadQualificationService } from "../services/update-lead-qualification-service";

export async function updateLeadQualification(leadId: string, card: string) {
  return updateLeadQualificationService({
    lead_id: leadId,
    card: card,
  });
}
