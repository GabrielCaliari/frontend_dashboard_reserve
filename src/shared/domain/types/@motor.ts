// Tipos do Motor de Reservas (docs/MOTOR_RESERVAS_RESERVE_MASTER.md).
// O backend serializa Decimal como string — o adapter converte para number
// antes de entregar aos componentes.

export interface MotorUnit {
  id: string;
  room_type_id: string;
  identificador: string;
  ativo: boolean;
}

export interface MotorRoomType {
  id: string;
  nome: string;
  descricao_curta: string | null;
  capacidade_base: number;
  capacidade_max: number;
  valor_pessoa_adicional: number;
  aceita_pets: boolean;
  taxa_pet_dia: number;
  ordem: number;
  ativo: boolean;
  units: MotorUnit[];
}

export interface MotorSeason {
  id: string;
  nome: string;
  data_inicio: string;
  data_fim: string;
  prioridade: number;
}

export interface MotorPriceRule {
  id: string;
  room_type_id: string;
  rate_plan_id: string | null;
  season_id: string | null;
  dow_mask: number;
  preco_noite: number;
  min_stay: number;
}

export interface MotorCancellationPolicy {
  id: string;
  nome: string;
  dias_antecedencia_remarcacao: number;
  reembolso_apos_prazo: boolean;
  taxa_noshow_percent: number;
}

export interface MotorRatePlan {
  id: string;
  room_type_id: string;
  nome: string;
  cancellation_policy_id: string | null;
  percentual_ajuste: number | null;
  ativo: boolean;
}

export interface MotorTarifasOverview {
  seasons: MotorSeason[];
  price_rules: MotorPriceRule[];
  policies: MotorCancellationPolicy[];
  rate_plans: MotorRatePlan[];
}

export interface MotorDailyInventoryRow {
  id: string;
  room_type_id: string;
  data: string;
  preco: number;
  min_stay: number;
  closed_arrival: boolean;
  closed_departure: boolean;
  stop_sell: boolean;
  override: boolean;
}

export type MotorReservationStatus =
  | 'HOLD'
  | 'CONFIRMADA'
  | 'CHECKIN_FEITO'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'NOSHOW';

export type MotorReservationOrigem =
  | 'BOT_WHATSAPP'
  | 'OTA_BOOKING'
  | 'OTA_AIRBNB'
  | 'OTA_DECOLAR'
  | 'SITE_HSYSTEM'
  | 'MANUAL';

export interface MotorReservationEvent {
  id: string;
  tipo: string;
  payload: Record<string, unknown> | null;
  autor: string | null;
  created_at: string;
}

export interface MotorReservation {
  id: string;
  room_type_id: string;
  unit_id: string;
  checkin: string;
  checkout: string;
  status: MotorReservationStatus;
  origem: MotorReservationOrigem;
  hospede_nome: string;
  hospede_telefone: string | null;
  hospede_email: string | null;
  adultos: number;
  criancas: number;
  pets: number;
  valor_total: number;
  valor_pago: number;
  saldo_checkin: number;
  forma_pagamento: string | null;
  observacoes: string | null;
  created_at: string;
  unit?: MotorUnit;
  room_type?: MotorRoomType;
  events?: MotorReservationEvent[];
}

export type MotorCalendarEstado = 'LIVRE' | 'HOLD' | 'CONFIRMADA' | 'OTA' | 'BLOCK' | 'MENSALISTA';

export interface MotorCalendarDia {
  data: string;
  estado: MotorCalendarEstado;
  reservation_id?: string;
  hold_id?: string;
  block_id?: string;
  hospede_nome?: string;
}

export interface MotorCalendarUnidade {
  unit_id: string;
  identificador: string;
  room_type_id: string;
  room_type_nome: string;
  dias: MotorCalendarDia[];
}

export interface MotorCalendar {
  mes: string;
  unidades: MotorCalendarUnidade[];
}

export interface MotorBlock {
  id: string;
  unit_id: string;
  data_inicio: string;
  data_fim: string | null;
  motivo: 'MANUTENCAO' | 'USO_PROPRIO' | 'MENSALISTA' | 'OUTRO';
  nota: string | null;
}

// ── DTOs de input ────────────────────────────────────────────────────────────

export interface CreateMotorRoomTypeDto {
  nome: string;
  descricao_curta?: string;
  capacidade_base: number;
  capacidade_max: number;
  valor_pessoa_adicional?: number;
  aceita_pets?: boolean;
  taxa_pet_dia?: number;
}

export type UpdateMotorRoomTypeDto = Partial<CreateMotorRoomTypeDto> & { ativo?: boolean };

export interface CreateMotorUnitDto {
  room_type_id: string;
  identificador: string;
}

export interface CreateMotorSeasonDto {
  nome: string;
  data_inicio: string;
  data_fim: string;
  prioridade?: number;
}

export interface CreateMotorPriceRuleDto {
  room_type_id: string;
  season_id?: string;
  dow_mask: number;
  preco_noite: number;
  min_stay?: number;
}

export interface CreateMotorPolicyDto {
  nome: string;
  dias_antecedencia_remarcacao: number;
  reembolso_apos_prazo: boolean;
  taxa_noshow_percent: number;
}

export interface UpsertMotorDailyInventoryDto {
  room_type_id: string;
  data: string;
  preco?: number;
  min_stay?: number;
  closed_arrival?: boolean;
  closed_departure?: boolean;
  stop_sell?: boolean;
}

export interface CreateMotorBlockDto {
  unit_id: string;
  data_inicio: string;
  data_fim?: string;
  motivo: MotorBlock['motivo'];
  nota?: string;
}

// ── Canais (Beds24) ──────────────────────────────────────────────────────────

export type MotorCanalStatus = 'OK' | 'DIVERGENTE' | 'ERRO' | 'DESCONECTADO';

export interface MotorCanalFilaErro {
  id: string;
  room_type_id: string;
  range_inicio: string;
  range_fim: string;
  attempts: number;
}

/**
 * Shape seguro do GET /canais — o backend NUNCA devolve refresh token nem
 * webhook_secret aqui (ChannelAdminService.toSafeShape).
 */
export interface MotorCanaisOverview {
  status: MotorCanalStatus;
  conectado: boolean;
  reconcile_2x: boolean;
  beds24_property_id: string | null;
  beds24_room_id_map: Record<string, number | string> | null;
  last_push_at: string | null;
  last_webhook_at: string | null;
  last_reconcile_at: string | null;
  fila_erros: MotorCanalFilaErro[];
}

export interface ConnectMotorCanalDto {
  invite_code: string;
  beds24_property_id: string;
}

/** Resposta do connect: o webhook_secret aparece AQUI, uma unica vez. */
export interface MotorCanalConnectResult extends Omit<MotorCanaisOverview, 'fila_erros'> {
  webhook_secret: string;
}

export interface CreateMotorManualReservationDto {
  room_type_id: string;
  unit_id?: string;
  checkin: string;
  checkout: string;
  hospede_nome: string;
  hospede_telefone?: string;
  adultos: number;
  criancas?: number;
  pets?: number;
  valor_total?: number;
  valor_pago?: number;
  origem?: 'MANUAL' | 'SITE_HSYSTEM';
  observacoes?: string;
}
