import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { BotIssueFilters, BotIssueStatus } from '@/src/shared/domain/types/@hotel-painel';

/** Erros e pedidos de socorro do bot (bot_issues), por hotel (`clientId`). */
const FIVE_MINUTES = 1000 * 60 * 5;
const base = (clientId: string | null) => ['hotel-portal', 'bot-issues', clientId] as const;

export function useBotIssues(clientId: string | null, filters: BotIssueFilters = {}) {
  return useQuery({
    queryKey: [...base(clientId), 'list', filters],
    queryFn: () => hotelPortalService.listBotIssues(clientId!, filters),
    enabled: !!clientId,
    retry: false,
    staleTime: 60_000,
  });
}

export function useBotIssuesSummary(
  clientId: string | null,
  period: { from: string; to: string },
) {
  return useQuery({
    queryKey: [...base(clientId), 'summary', period.from, period.to],
    queryFn: () => hotelPortalService.getBotIssuesSummary(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useBotIssue(clientId: string | null, id: string | null) {
  return useQuery({
    queryKey: [...base(clientId), 'detail', id],
    queryFn: () => hotelPortalService.getBotIssue(clientId!, id!),
    enabled: !!clientId && !!id,
    retry: false,
  });
}

/**
 * Muda o status de uma issue (admin, escopado por `tenantId`). `clientId` e o
 * escopo das queries do painel: invalida lista, resumo e detalhe.
 */
export function useUpdateBotIssueStatus(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BotIssueStatus }) =>
      hotelPortalService.updateBotIssueStatus(tenantId!, id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: base(clientId) }),
  });
}
