"use server";

import { temperatureAnalysisByMessageIdService } from "@/src/modules/leads/infrastructure/adapters";

export async function temperatureAnalysisByMessageId(messageId: string) {
  return temperatureAnalysisByMessageIdService({
    message_id: messageId,
  });
}
