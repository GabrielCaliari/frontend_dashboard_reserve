// Painel Reserve — blocos do cliente de hotelaria servidos por
// reserve-client-portal (`ClientPortalController`, rotas `/hotel-portal/*`).
//
// Estes tipos espelham EXATAMENTE o retorno dos services do backend. O backend
// devolve camelCase nestes blocos (diferente do snake_case do contrato v1 em
// `@hotel-portal-v1.ts`), entao nao normalize aqui — o que chega e o que esta
// escrito abaixo.

import type { Metric } from './@hotel-portal-v1';

/**
 * ATENCAO: o backend serializa dinheiro como `{ value, currency }` (ver
 * `PeriodComparisonService.money()`), e NAO `{ amount, currency }` como diz o
 * doc do contrato v1. Aqui vale o codigo, nao o documento. `value` esta sempre
 * em centavos.
 */
export type PainelMoney = { value: number; currency: 'BRL' };

/**
 * Lembrete sobre `Metric.delta`: e a diferenca ABSOLUTA (value - previous),
 * nao um percentual. Quem precisar de variacao percentual calcula na
 * apresentacao.
 */

// ── Leads / Camada 1 (GET /hotel-portal/:clientId/leads-overview) ───────────

export interface LeadsOverviewResponse {
  clicks: Metric;
  byDay: { date: string; count: number }[];
  byDevice: { device: string; count: number }[];
  byCity: { city: string; count: number }[];
}

// ── ROI (GET /hotel-portal/:clientId/roi) ──────────────────────────────────

/**
 * O backend agrupa por `campaign_id` cru — nao devolve o nome da campanha.
 * Nao inventar join no front: mostre o id ate o backend enriquecer.
 */
export interface RoiByCampaignRow {
  campaignId: string;
  conversas: number;
  qualificados: number;
}

/**
 * Custo por conversa e a UNICA metrica em que cair e boa noticia (§3.9), por
 * isso o backend manda a direcao pronta em vez de o front inverter cor caso a
 * caso.
 */
export type CostPerConversationMetric = Metric & {
  trendDirection: 'improving' | 'worsening';
};

/** Nivel 1 — sempre presente. */
export interface RoiNivel1 {
  spend: Metric;
  conversas: Metric;
  costPerConversation: CostPerConversationMetric;
}

/**
 * Nivel 2 — a chave so aparece quando o tenant tem BotIntegrationConfig ativo
 * (RoiAnalysisService gateia nisso). Ausente significa "bot nao provisionado",
 * nao "erro".
 */
export interface RoiNivel2 {
  costPerQualifiedLead: number;
  costPerReadyToClose: number;
  qualificationRate: number;
  roiByCampaign: RoiByCampaignRow[];
}

/**
 * Nivel 3 — a chave so aparece quando o motor de reservas nao e MANUAL.
 * Regra inegociavel do §3.9: nenhuma receita estimada sem integracao real.
 */
export interface RoiNivel3 {
  revenueAttributed: PainelMoney;
  roas: number;
  avgTicket: PainelMoney;
  leadToReservationRate: number;
}

export interface RoiResponse {
  period: { from: string; to: string };
  comparedTo: { from: string; to: string };
  attributionWindow: { days: number; visible: boolean };
  nivel1: RoiNivel1;
  nivel2?: RoiNivel2;
  nivel3?: RoiNivel3;
}

// ── Canais do bot (GET /hotel-portal/:clientId/whatsapp/channels) ───────────

export interface BotChannelsResponse {
  whatsapp: {
    connected: boolean;
    botEnabled: boolean;
    heartbeatAgeMinutes: number | null;
    heartbeatStale: boolean;
    activeConversations: number;
    pausedAwaitingHuman: number;
  };
  instagram: { connected: boolean; tokenStatus: string | null };
  metaAds: { connected: boolean; lastSyncAt?: string | null };
}

// ── Conversas (GET /hotel-portal/:clientId/whatsapp/conversations) ──────────

export type FunnelStage =
  | 'CONTATO_INICIADO'
  | 'PUBLICO_IDENTIFICADO'
  | 'QUALIFICADO'
  | 'ACOMODACAO_APRESENTADA'
  | 'OFERTA_FEITA'
  | 'FECHAMENTO_INICIADO'
  | 'COMPROVANTE_RECEBIDO'
  | 'RESERVA_CONFIRMADA'
  | 'PERDIDO';

export type BotContactAudience =
  | 'LEAD'
  | 'HOSPEDE_EM_ESTADIA'
  | 'MENSALISTA'
  | 'MARINA'
  | 'EQUIPE';

export interface FunnelStageChangeDto {
  para_estagio: FunnelStage;
  motivo?: string;
  tipo_publico?: BotContactAudience;
}

export type BotContactStatus = 'ATIVO' | 'PAUSADO';

export interface ConversationListItem {
  numeroContato: string;
  nome: string | null;
  statusBot: BotContactStatus;
  lastMessageAt: string | null;
  consentimentoLgpd: boolean;
  currentStage: FunnelStage;
  /**
   * Deep link para o Chatwoot. `null` quando o tenant nao tem
   * `chatwoot_base_url` configurado — o backend nunca devolve link quebrado.
   * Decisao 11 do plano mestre: responder acontece no Chatwoot, nunca aqui.
   */
  chatwootDeepLink: string | null;
}

export interface ConversationListResponse {
  conversations: ConversationListItem[];
}

export interface ConversationMessage {
  role: string;
  tipo: string;
  contentPreview: string | null;
  ocorridoEm: string;
}

export interface ConversationDetailResponse {
  contact: {
    numeroContato: string;
    nome: string | null;
    statusBot: BotContactStatus;
    consentimentoLgpd: boolean;
    currentStage: FunnelStage;
    chatwootDeepLink: string | null;
  };
  messages: ConversationMessage[];
}

export interface ConversationFilters {
  search?: string;
  stage?: FunnelStage;
  from?: string;
  to?: string;
}

// ── Funil do bot (GET /hotel-portal/:clientId/whatsapp/funnel) ──────────────

export interface FunnelBoardLead {
  numeroContato: string;
  nome: string | null;
  acomodacaoInteresse: string | null;
  datasInteresse: string | null;
  tipoPublico: BotContactAudience | null;
}

export interface FunnelBoardColumn {
  stage: FunnelStage;
  count: number;
  leads: FunnelBoardLead[];
}

export interface FunnelMetricsResponse {
  conversasIniciadas: Metric;
  taxaRespostaBot: number;
  tempoMedioPrimeiraRespostaSegundos: number | null;
  distribuicaoFunil: { stage: FunnelStage; count: number }[];
  tempoMedioPorEstagioSegundos: { stage: FunnelStage; seconds: number | null }[];
  taxaQualificacao: number;
  leadsProntos: number;
  taxaConversaoPorEtapa: { stage: FunnelStage; count: number; rate: number }[];
  efetividadeFollowup: { tipoJanela: string; status: string; count: number }[];
  volumePorOrigem: { origem: string; count: number }[];
  contatosPausados: number;
  audiosTranscritos: number;
}

// ── Propostas de config do bot (…/bot-config-proposals) ─────────────────────

/**
 * Conjunto fechado aceito pelo backend (`BOT_CONFIG_PROPOSAL_CATEGORIES`).
 * Decisao 13 do plano mestre: o cliente propoe DADOS, nunca comportamento —
 * por isso nao existe categoria de system prompt nem de regras do bot.
 */
export const BOT_CONFIG_PROPOSAL_CATEGORIES = [
  'pricing',
  'policies',
  'packages',
  'hours',
] as const;

export type BotConfigProposalCategory =
  (typeof BOT_CONFIG_PROPOSAL_CATEGORIES)[number];

export type BotConfigProposalStatus =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA';

export interface BotConfigProposal {
  id: string;
  campo: string;
  categoria: BotConfigProposalCategory;
  valor_atual: unknown;
  valor_proposto: unknown;
  status: BotConfigProposalStatus;
  justificativa: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBotConfigProposalDto {
  campo: string;
  categoria: BotConfigProposalCategory;
  valor_atual?: unknown;
  valor_proposto: unknown;
}

// ── Instagram (GET /hotel-portal/:clientId/instagram) ───────────────────────

/** Espelha `IInstagramMedia` do provider — sem permalink, sem mediaType. */
export interface InstagramMedia {
  id: string;
  caption: string | null;
  mediaUrl: string | null;
  likeCount: number;
  commentCount: number;
  timestamp: string;
}

export interface InstagramOverviewResponse {
  followers: Metric;
  reach: Metric;
  engagement: {
    totalInteractions: Metric;
    engagedAccounts: Metric;
    rate: Metric;
  };
  topPosts: InstagramMedia[];
}

// ── Calendario de conteudo (GET /hotel-portal/:clientId/content-posts) ──────

export type ContentPostStatus = 'draft' | 'scheduled' | 'published';
export type ContentPlatform = 'instagram' | 'facebook';

/** Linha crua do model `ContentPost` — o backend devolve o registro do Prisma. */
export interface ContentPost {
  id: string;
  platform: ContentPlatform;
  status: ContentPostStatus;
  scheduled_for: string | null;
  published_at: string | null;
  caption_preview: string | null;
  thumbnail_url: string | null;
  permalink: string | null;
}

// ── Feed de atividades (GET /hotel-portal/:clientId/activities) ─────────────

export type ActivityLogType = 'auto' | 'manual';
export type ActivityLogCategory =
  | 'post'
  | 'campaign'
  | 'report'
  | 'bot'
  | 'meeting'
  | 'other';

export interface ActivityLogEntry {
  id: string;
  type: ActivityLogType;
  category: ActivityLogCategory;
  title: string;
  description: string | null;
  icon: string | null;
  created_at: string;
}

export interface ActivityLogPage {
  data: ActivityLogEntry[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// ── Plano semestral (GET /hotel-portal/:clientId/semester-plan) ─────────────

export type SemesterPlanDeliveryStatus =
  | 'planejado'
  | 'em_andamento'
  | 'concluido';

export interface SemesterPlanDelivery {
  id: string;
  /** Ordinal do mes DENTRO do semestre (1..6), nao o mes do calendario. */
  mes: number;
  titulo: string;
  descricao: string | null;
  status: SemesterPlanDeliveryStatus;
  ordem: number;
}

/**
 * `eixos` e uma coluna Json livre no banco — na pratica uma lista de rotulos.
 * Tratada como `unknown` e normalizada na apresentacao, nunca confiada cega.
 */
export interface SemesterPlan {
  id: string;
  semestre: string;
  titulo: string;
  eixos: unknown;
  Deliveries: SemesterPlanDelivery[];
}

// ── Marcos / Evolucao (GET /admin/hotel-portal/:tenantId/milestones) ────────

export type MilestoneType =
  | 'marco_zero'
  | 'seguidor'
  | 'campanha'
  | 'bot'
  | 'recorde'
  | 'custom';

export interface Milestone {
  id: string;
  date: string;
  title: string;
  type: MilestoneType;
}

// ── Home consolidada (GET /hotel-portal/:clientId/home) ─────────────────────
//
// Junta o funil do bot com as metricas do motor de reservas na mesma tela.
// Dinheiro aqui vem em REAIS (nao centavos como PainelMoney) — o motor nao
// segue a convencao do resto do painel.

export interface MotorHomeMetrics {
  receita: number;
  reservas: number;
  ticket_medio: number;
  room_nights: number;
  canceladas: { quantidade: number; valor: number };
  a_recuperar: { quantidade: number; valor: number };
  receita_bot: number;
  por_origem: { origem: string; reservas: number; receita: number }[];
}

export interface HotelHomeResponse {
  period: { from: string; to: string };
  funil: FunnelMetricsResponse;
  motor: MotorHomeMetrics;
}
