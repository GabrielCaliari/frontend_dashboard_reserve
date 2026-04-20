"use server";

import { completeScreeningService } from "@/src/modules/leads/infrastructure/adapters";

export async function completeScreening(leadId: string) {
  return completeScreeningService({
    lead_id: leadId,
  });
}
