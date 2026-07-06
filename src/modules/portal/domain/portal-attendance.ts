/**
 * §5 — Módulo de automação de atendimento WhatsApp.
 *
 * BLOCKED (backend): every endpoint referenced by the types and service in
 * this module depends on the bot-event ingestion API (`POST
 * /api/ingest/bot-events`), the N8N event nodes, and the `funil_eventos`
 * table (master doc §5.6) — none of that exists yet. This module builds the
 * full client-scoped UI against the documented fixtures so it is ready the
 * moment those land.
 */
export type ChannelKind = "whatsapp" | "instagram" | "meta_ads";
export type ChannelHealth = "ok" | "warning" | "error";

export interface ChannelStatus {
  kind: ChannelKind;
  label: string;
  connected: boolean;
  health: ChannelHealth;
  health_message: string;
  /** WhatsApp only: is the bot currently answering (config.bot_global) */
  bot_active?: boolean;
  /** WhatsApp only: contacts paused awaiting a human, master doc §5.2 */
  paused_contacts_count?: number;
  last_heartbeat_at?: string;
}

export type FunnelStageStatus = "NOVO" | "QUALIFICADO" | "PAGAMENTO" | "FECHADO" | "FRIO";

export interface Conversation {
  id: string;
  contact_number: string;
  contact_name: string | null;
  origin: "anuncio" | "organico";
  campaign_name: string | null;
  stage: FunnelStageStatus;
  last_message_at: string;
  bot_status: "ATIVO" | "PAUSADO";
  pause_reason: string | null;
  paused_since: string | null;
  consentimento_lgpd: boolean;
  chatwoot_url: string;
}

export interface ConversationFilters {
  search?: string;
  from?: string;
  to?: string;
  stage?: FunnelStageStatus;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "human";
  tipo: "texto" | "audio" | "imagem";
  content: string;
  sent_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ConversationMessage[];
}

export interface FunnelStageCount {
  stage: FunnelStageStatus;
  label: string;
  count: number;
  /** sum of accommodation value when informed, master doc §5.4 "valor potencial" */
  potential_value: number | null;
  isFronteira?: boolean;
}

export interface MoveFunnelStagePayload {
  numero_contato: string;
  de_estagio: FunnelStageStatus;
  para_estagio: FunnelStageStatus;
  motivo: string;
}

export interface AttendanceMetrics {
  conversas_iniciadas: { value: number; variation_pct: number };
  taxa_resposta_bot_pct: number;
  tempo_medio_primeira_resposta_seg: number;
  taxa_qualificacao_pct: number;
  leads_prontos_fechar: number;
  tempo_medio_por_estagio: { stage: FunnelStageStatus; avg_hours: number }[];
  followup_effectiveness: { toque: "4h" | "24h" | "72h" | "7d"; respondeu_pct: number }[];
  volume_por_origem: { origem: "anuncio" | "organico" | "link_rastreavel"; count: number }[];
  contatos_pausados_aguardando: number;
  audios_transcritos: number;
}
