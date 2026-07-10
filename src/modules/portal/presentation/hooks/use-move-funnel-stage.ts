"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portalAttendanceService } from "@/src/modules/portal/infrastructure/portal-attendance-service";
import type { MoveFunnelStagePayload } from "@/src/modules/portal/domain/portal-attendance";

/**
 * Master doc §5.4: "a gravação nunca sobrescreve o campo do bot diretamente
 * — grava um evento." On success, invalidates the funnel query so the
 * columns re-fetch the authoritative count; on error, it does *not*
 * optimistically mutate the cache — a failed write reconciles via a
 * backend job, so the client surfaces an error and lets the next
 * successful fetch be the source of truth, rather than guessing at local
 * state that might diverge.
 */
export function useMoveFunnelStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MoveFunnelStagePayload) => portalAttendanceService.moveFunnelStage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portal", "attendance", "funnel"] });
    },
  });
}
