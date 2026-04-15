"use server";

import { completeScreeningService } from "@/src/common/services/complete-screening-service";

export async function completeScreening(leadId: string) {
  return completeScreeningService({
    lead_id: leadId,
  });
}
