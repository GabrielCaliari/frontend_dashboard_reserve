import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import { moveLeadInBoard } from '@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages';
import type { Period } from '@/src/shared/domain/types/@hotel-portal-v1';
import type {
  ConversationFilters,
  CreateBotConfigProposalDto,
  FunnelBoardColumn,
  FunnelStageChangeDto,
} from '@/src/shared/domain/types/@hotel-painel';

/**
 * Hooks dos blocos do Painel Reserve (§3.x do plano mestre) servidos pelo
 * `ClientPortalController` do backend.
 *
 * Todos recebem `clientId` explicito e ficam desabilitados enquanto ele for
 * nulo — o hotel ativo vem de `useActiveHotelClient()`, nunca de uma sessao
 * implicita. Foi exatamente esse escopo implicito que derrubou a antiga area
 * `/portal`.
 */

const FIVE_MINUTES = 1000 * 60 * 5;

export function useHotelLeadsOverview(clientId: string | null, period: Period) {
  return useQuery({
    queryKey: ['hotel-portal', 'leads-overview', clientId, period.from, period.to],
    queryFn: () => hotelPortalService.getLeadsOverview(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelRoi(clientId: string | null, period: Period) {
  return useQuery({
    queryKey: ['hotel-portal', 'roi', clientId, period.from, period.to],
    queryFn: () => hotelPortalService.getRoi(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelSemesterPlans(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'semester-plan', clientId],
    queryFn: () => hotelPortalService.getSemesterPlans(clientId!),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelBotChannels(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'bot-channels', clientId],
    queryFn: () => hotelPortalService.getBotChannels(clientId!),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60,
  });
}

export function useHotelConversations(
  clientId: string | null,
  filters: ConversationFilters,
) {
  return useQuery({
    queryKey: ['hotel-portal', 'conversations', clientId, filters],
    queryFn: () => hotelPortalService.listConversations(clientId!, filters),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60,
  });
}

export function useHotelConversationDetail(
  clientId: string | null,
  numeroContato: string | null,
) {
  return useQuery({
    queryKey: ['hotel-portal', 'conversation', clientId, numeroContato],
    queryFn: () =>
      hotelPortalService.getConversationDetail(clientId!, numeroContato!),
    enabled: !!clientId && !!numeroContato,
    retry: false,
  });
}

export function useHotelFunnelBoard(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'funnel-board', clientId],
    queryFn: () => hotelPortalService.getFunnelBoard(clientId!),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60,
  });
}

/**
 * Move um lead de estagio no funil do bot com atualizacao otimista do board
 * (`useHotelFunnelBoard`). Em erro, o rollback restaura o board anterior.
 * `tenantId` e o dono do contato (endpoint admin escopado por tenant);
 * `clientId` e o escopo usado pelas queries do painel que precisam
 * invalidar apos a mudanca de estagio.
 */
export function useMoveFunnelStage(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  const boardKey = ['hotel-portal', 'funnel-board', clientId];
  return useMutation({
    mutationFn: ({ numeroContato, dto }: { numeroContato: string; dto: FunnelStageChangeDto }) =>
      hotelPortalService.moveFunnelStage(tenantId!, numeroContato, dto),
    onMutate: async ({ numeroContato, dto }) => {
      await qc.cancelQueries({ queryKey: boardKey });
      const previous = qc.getQueryData<FunnelBoardColumn[]>(boardKey);
      if (previous) {
        qc.setQueryData(boardKey, moveLeadInBoard(previous, numeroContato, dto.para_estagio));
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(boardKey, ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: boardKey });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-metrics', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'home', clientId] });
    },
  });
}

export function useHotelFunnelMetrics(clientId: string | null, period: Period) {
  return useQuery({
    queryKey: ['hotel-portal', 'funnel-metrics', clientId, period.from, period.to],
    queryFn: () => hotelPortalService.getFunnelMetrics(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelBotConfigProposals(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'bot-config-proposals', clientId],
    queryFn: () => hotelPortalService.listBotConfigProposals(clientId!),
    enabled: !!clientId,
    retry: false,
  });
}

export function useCreateBotConfigProposal(clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBotConfigProposalDto) =>
      hotelPortalService.createBotConfigProposal(clientId!, data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ['hotel-portal', 'bot-config-proposals', clientId],
      }),
  });
}

export function useHotelInstagram(clientId: string | null, period: Period) {
  return useQuery({
    queryKey: ['hotel-portal', 'instagram', clientId, period.from, period.to],
    queryFn: () => hotelPortalService.getInstagramOverview(clientId!, period),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelContentPosts(clientId: string | null, month: string) {
  return useQuery({
    queryKey: ['hotel-portal', 'content-posts', clientId, month],
    queryFn: () => hotelPortalService.getContentPosts(clientId!, month),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

export function useHotelActivities(
  clientId: string | null,
  params?: { page?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['hotel-portal', 'activities', clientId, params],
    queryFn: () => hotelPortalService.getActivities(clientId!, params),
    enabled: !!clientId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}

/** Marcos da linha do tempo — escopado por tenant, nao por client. */
export function useHotelMilestones(tenantId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'milestones', tenantId],
    queryFn: () => hotelPortalService.listMilestones(tenantId!),
    enabled: !!tenantId,
    retry: false,
    staleTime: FIVE_MINUTES,
  });
}
