import { useQuery, useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import { moveLeadInBoard } from '@/src/presentation/components/organisms/hotel-portal/funil/funnel-stages';
import type { Period } from '@/src/shared/domain/types/@hotel-portal-v1';
import type {
  ConversationDetailResponse,
  ConversationFilters,
  ConversationMessage,
  CreateBotConfigProposalDto,
  FunnelBoardColumn,
  FunnelStage,
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

/**
 * F1 (auditoria 06/10): o bot manda eventos a cada minuto pelo Canal A, entao
 * inbox, conversa, funil e canais se atualizam sozinhos. Com a aba escondida
 * o React Query ja nao refaz a busca (refetchIntervalInBackground = false).
 */
export const LIVE_REFETCH = { conversations: 30_000, funnel: 60_000, channels: 60_000 } as const;

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
    refetchInterval: LIVE_REFETCH.channels,
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
    refetchInterval: LIVE_REFETCH.conversations,
  });
}

export function useHotelConversationDetail(
  clientId: string | null,
  numeroContato: string | null,
) {
  return useInfiniteQuery({
    queryKey: ['hotel-portal', 'conversation', clientId, numeroContato],
    // `before` = ocorridoEm da mensagem mais antiga ja carregada; sem ele o
    // backend devolve as mensagens mais recentes.
    queryFn: ({ pageParam }) =>
      hotelPortalService.getConversationDetail(clientId!, numeroContato!, {
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: ConversationDetailResponse) =>
      lastPage.hasMore && lastPage.messages.length > 0
        ? lastPage.messages[0].ocorridoEm
        : undefined,
    enabled: !!clientId && !!numeroContato,
    retry: false,
    // O refetch automatico refaz todas as paginas carregadas (comportamento do
    // useInfiniteQuery); a primeira traz as mensagens novas.
    refetchInterval: LIVE_REFETCH.conversations,
  });
}

/**
 * Junta as paginas da conversa (a primeira e a mais recente; cada pagina
 * seguinte e mais antiga) em uma unica lista em ordem cronologica crescente.
 * `hasMore` vem da pagina mais antiga carregada.
 */
export function flattenConversationPages(
  data: InfiniteData<ConversationDetailResponse, unknown> | undefined,
): {
  contact: ConversationDetailResponse['contact'] | undefined;
  messages: ConversationMessage[];
  hasMore: boolean;
} {
  const pages = data?.pages ?? [];
  if (pages.length === 0) return { contact: undefined, messages: [], hasMore: false };
  return {
    contact: pages[0].contact,
    messages: [...pages].reverse().flatMap((p) => p.messages),
    hasMore: pages[pages.length - 1].hasMore,
  };
}

export function useHotelFunnelBoard(
  clientId: string | null,
  options: { paused?: boolean } = {},
) {
  return useQuery({
    queryKey: ['hotel-portal', 'funnel-board', clientId],
    queryFn: () => hotelPortalService.getFunnelBoard(clientId!),
    enabled: !!clientId,
    retry: false,
    staleTime: 1000 * 60,
    // pausado durante o arrastar e enquanto o movimento otimista esta em voo,
    // para a busca nao desfazer o card
    refetchInterval: options.paused ? false : LIVE_REFETCH.funnel,
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

/**
 * Retomada humana de conversa pausada: despausa o bot e (opcionalmente)
 * devolve o lead ao estagio escolhido. `tenantId` escopa o endpoint admin;
 * `clientId` escopa as queries do painel a invalidar.
 */
export function useResumeConversation(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroContato, estagio }: { numeroContato: string; estagio?: FunnelStage }) =>
      hotelPortalService.resumeConversation(tenantId!, numeroContato, { estagio }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversations', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversation', clientId, vars.numeroContato] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-board', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-metrics', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-channels', clientId] });
    },
  });
}

/** "Assumir conversa": o humano pausa o bot para aquele contato. */
export function usePauseConversation(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroContato, motivo }: { numeroContato: string; motivo?: string }) =>
      hotelPortalService.pauseConversation(tenantId!, numeroContato, { motivo }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversations', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'conversation', clientId, vars.numeroContato] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-board', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-channels', clientId] });
    },
  });
}

/** Estende o prazo da pre-reserva que esta aguardando pagamento. */
export function useExtendHold(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ numeroContato, codigo, minutos }: { numeroContato: string; codigo?: string; minutos?: number }) =>
      hotelPortalService.extendHold(tenantId!, numeroContato, { codigo, minutos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'funnel-board', clientId] }),
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

export function useApproveBotConfigProposal(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hotelPortalService.approveBotConfigProposal(tenantId!, id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-config-proposals', clientId] }),
  });
}

export function useRejectBotConfigProposal(tenantId: string | null, clientId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, justificativa }: { id: string; justificativa: string }) =>
      hotelPortalService.rejectBotConfigProposal(tenantId!, id, { justificativa }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'bot-config-proposals', clientId] }),
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
