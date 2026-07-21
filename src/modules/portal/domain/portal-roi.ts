/**
 * §3.9 — Análise de Retorno, três níveis progressivos.
 * Nível 1 is available to every client (no bot/reservation-engine
 * dependency). Nível 2 is gated on the WhatsApp bot being active. Nível 3
 * ("real ROAS") only unlocks with a reservation-engine integration.
 *
 * BLOCKED (backend): GET /portal/roi/level1, /level2, /level3 don't exist.
 */
export interface RoiQuery {
  from: string;
  to: string;
}

export interface RoiLevel1 {
  investimento_total: number;
  conversas_geradas: number;
  custo_por_conversa: number;
  custo_por_conversa_variation_pct: number;
  custo_por_conversa_history: { date: string; custo_por_conversa: number }[];
}

export interface RoiLevel2 {
  custo_por_lead_qualificado: number;
  custo_por_lead_pronto_fechar: number;
  taxa_qualificacao_pct: number;
  roi_por_campanha: { campaign_id: string; campaign_name: string; custo_por_lead_qualificado: number }[];
}

export interface RoiLevel3 {
  unlocked: boolean;
  receita_atribuida: number | null;
  roas: number | null;
  ticket_medio: number | null;
  taxa_conversao_lead_reserva_pct: number | null;
}
