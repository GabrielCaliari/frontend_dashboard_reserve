"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { portalBotConfigService } from "@/src/modules/portal/infrastructure/portal-bot-config-service";

export function useBotConfigFields() {
  return useQuery({ queryKey: ["portal", "bot-config", "fields"], queryFn: portalBotConfigService.getFields });
}

export function useBotConfigProposals() {
  return useQuery({ queryKey: ["portal", "bot-config", "proposals"], queryFn: portalBotConfigService.getProposals });
}

export function useCreateBotConfigProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ fieldId, valorProposto }: { fieldId: string; valorProposto: string }) =>
      portalBotConfigService.createProposal(fieldId, valorProposto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portal", "bot-config", "proposals"] }),
  });
}
