"use server";

import { temperatureAnalysisByMessageIdService } from "@/src/common/services/temperature-analysis-by-message-id-service";

export async function temperatureAnalysisByMessageId(messageId: string) {
  return temperatureAnalysisByMessageIdService({
    message_id: messageId,
  });
}
