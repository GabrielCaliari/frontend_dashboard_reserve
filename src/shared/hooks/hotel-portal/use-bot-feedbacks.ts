import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { FeedbackFilters } from '@/src/shared/domain/types/@hotel-painel';

/** Feedbacks pos-estadia dos hospedes (bot_feedbacks), por hotel (`clientId`). */
const base = (clientId: string | null) => ['hotel-portal', 'bot-feedbacks', clientId] as const;

export function useFeedbacks(clientId: string | null, filters: FeedbackFilters = {}) {
  return useQuery({
    queryKey: [...base(clientId), 'list', filters],
    queryFn: () => hotelPortalService.listFeedbacks(clientId!, filters),
    enabled: !!clientId,
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
}

export function useFeedbacksSummary(
  clientId: string | null,
  period: { from: string; to: string },
) {
  return useQuery({
    queryKey: [...base(clientId), 'summary', period.from, period.to],
    queryFn: () => hotelPortalService.getFeedbacksSummary(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: 60_000,
  });
}
