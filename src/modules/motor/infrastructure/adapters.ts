import api from '@/src/infraestructure/axios/api';
import type {
  CreateMotorBlockDto,
  CreateMotorManualReservationDto,
  CreateMotorPolicyDto,
  CreateMotorPriceRuleDto,
  CreateMotorRoomTypeDto,
  CreateMotorSeasonDto,
  CreateMotorUnitDto,
  MotorBlock,
  MotorCalendar,
  MotorDailyInventoryRow,
  MotorReservation,
  MotorRoomType,
  MotorTarifasOverview,
  UpdateMotorRoomTypeDto,
  UpsertMotorDailyInventoryDto,
} from '@/src/shared/domain/types/@motor';

// Rotas admin do motor sao chaveadas por :tenantId no path — o header
// x-tenant-id e redundante e o interceptor o remove com x-skip-tenant
// (mesma convencao do hotelPortalService).
const adminConfig = { headers: { 'x-skip-tenant': 'true' } };

// Prisma Decimal chega como string no JSON; normaliza os campos de dinheiro.
function num(value: unknown): number {
  return value == null ? 0 : Number(value);
}

function normalizeRoomType(raw: any): MotorRoomType {
  return {
    ...raw,
    valor_pessoa_adicional: num(raw.valor_pessoa_adicional),
    taxa_pet_dia: num(raw.taxa_pet_dia),
    units: raw.units ?? [],
  };
}

function normalizeReservation(raw: any): MotorReservation {
  return {
    ...raw,
    checkin: String(raw.checkin).slice(0, 10),
    checkout: String(raw.checkout).slice(0, 10),
    valor_total: num(raw.valor_total),
    valor_pago: num(raw.valor_pago),
    saldo_checkin: num(raw.saldo_checkin),
  };
}

export const motorService = {
  // ── Acomodacoes ──────────────────────────────────────────────────────────
  async listRoomTypes(tenantId: string): Promise<MotorRoomType[]> {
    const res = await api.get(`/motor/${tenantId}/room-types`, adminConfig);
    return (res.data as any[]).map(normalizeRoomType);
  },
  async createRoomType(tenantId: string, dto: CreateMotorRoomTypeDto): Promise<MotorRoomType> {
    const res = await api.post(`/motor/${tenantId}/room-types`, dto, adminConfig);
    return normalizeRoomType(res.data);
  },
  async updateRoomType(tenantId: string, id: string, dto: UpdateMotorRoomTypeDto): Promise<MotorRoomType> {
    const res = await api.put(`/motor/${tenantId}/room-types/${id}`, dto, adminConfig);
    return normalizeRoomType(res.data);
  },
  async createUnit(tenantId: string, dto: CreateMotorUnitDto) {
    const res = await api.post(`/motor/${tenantId}/units`, dto, adminConfig);
    return res.data;
  },
  async updateUnit(tenantId: string, id: string, dto: { identificador?: string; ativo?: boolean }) {
    const res = await api.put(`/motor/${tenantId}/units/${id}`, dto, adminConfig);
    return res.data;
  },

  // ── Tarifas ──────────────────────────────────────────────────────────────
  async getTarifas(tenantId: string): Promise<MotorTarifasOverview> {
    const res = await api.get(`/motor/${tenantId}/tarifas`, adminConfig);
    const data = res.data as any;
    return {
      seasons: (data.seasons ?? []).map((s: any) => ({
        ...s,
        data_inicio: String(s.data_inicio).slice(0, 10),
        data_fim: String(s.data_fim).slice(0, 10),
      })),
      price_rules: (data.price_rules ?? []).map((r: any) => ({ ...r, preco_noite: num(r.preco_noite) })),
      policies: (data.policies ?? []).map((p: any) => ({ ...p, taxa_noshow_percent: num(p.taxa_noshow_percent) })),
      rate_plans: (data.rate_plans ?? []).map((p: any) => ({
        ...p,
        percentual_ajuste: p.percentual_ajuste == null ? null : num(p.percentual_ajuste),
      })),
    };
  },
  async createSeason(tenantId: string, dto: CreateMotorSeasonDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/seasons`, dto, adminConfig)).data;
  },
  async updateSeason(tenantId: string, id: string, dto: Partial<CreateMotorSeasonDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/seasons/${id}`, dto, adminConfig)).data;
  },
  async deleteSeason(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/tarifas/seasons/${id}`, adminConfig)).data;
  },
  async createPriceRule(tenantId: string, dto: CreateMotorPriceRuleDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/price-rules`, dto, adminConfig)).data;
  },
  async updatePriceRule(tenantId: string, id: string, dto: Partial<CreateMotorPriceRuleDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/price-rules/${id}`, dto, adminConfig)).data;
  },
  async deletePriceRule(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/tarifas/price-rules/${id}`, adminConfig)).data;
  },
  async createPolicy(tenantId: string, dto: CreateMotorPolicyDto) {
    return (await api.post(`/motor/${tenantId}/tarifas/policies`, dto, adminConfig)).data;
  },
  async updatePolicy(tenantId: string, id: string, dto: Partial<CreateMotorPolicyDto>) {
    return (await api.put(`/motor/${tenantId}/tarifas/policies/${id}`, dto, adminConfig)).data;
  },
  async listDailyInventory(
    tenantId: string,
    params: { room_type_id: string; from: string; to: string },
  ): Promise<MotorDailyInventoryRow[]> {
    const res = await api.get(`/motor/${tenantId}/daily-inventory`, { params, ...adminConfig });
    return (res.data as any[]).map((row) => ({
      ...row,
      data: String(row.data).slice(0, 10),
      preco: num(row.preco),
    }));
  },
  async upsertDailyInventory(tenantId: string, dto: UpsertMotorDailyInventoryDto) {
    return (await api.put(`/motor/${tenantId}/daily-inventory`, dto, adminConfig)).data;
  },

  // ── Calendario e blocks ──────────────────────────────────────────────────
  async getCalendar(tenantId: string, mes: string): Promise<MotorCalendar> {
    const res = await api.get(`/motor/${tenantId}/calendar`, { params: { mes }, ...adminConfig });
    return res.data as MotorCalendar;
  },
  async createBlock(tenantId: string, dto: CreateMotorBlockDto): Promise<MotorBlock> {
    return (await api.post(`/motor/${tenantId}/blocks`, dto, adminConfig)).data as MotorBlock;
  },
  async deleteBlock(tenantId: string, id: string) {
    return (await api.delete(`/motor/${tenantId}/blocks/${id}`, adminConfig)).data;
  },

  // ── Reservas ─────────────────────────────────────────────────────────────
  async listReservations(
    tenantId: string,
    params?: { from?: string; to?: string; status?: string; origem?: string },
  ): Promise<MotorReservation[]> {
    const res = await api.get(`/motor/${tenantId}/reservations`, { params, ...adminConfig });
    return (res.data as any[]).map(normalizeReservation);
  },
  async getReservation(tenantId: string, id: string): Promise<MotorReservation> {
    const res = await api.get(`/motor/${tenantId}/reservations/${id}`, adminConfig);
    return normalizeReservation(res.data);
  },
  async createManualReservation(tenantId: string, dto: CreateMotorManualReservationDto) {
    return normalizeReservation(
      (await api.post(`/motor/${tenantId}/reservations`, dto, adminConfig)).data,
    );
  },
  async rescheduleReservation(
    tenantId: string,
    id: string,
    dto: { novo_checkin: string; novo_checkout: string },
  ) {
    return normalizeReservation(
      (await api.post(`/motor/${tenantId}/reservations/${id}/reschedule`, dto, adminConfig)).data,
    );
  },
  async cancelReservation(tenantId: string, id: string, dto: { motivo: string }) {
    return (await api.post(`/motor/${tenantId}/reservations/${id}/cancel`, dto, adminConfig)).data;
  },
};
