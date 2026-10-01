import type { BotContactStatus } from "@/src/shared/domain/types/@hotel-painel";

/**
 * Fonte unica dos rotulos e regras do status do bot (contrato v2 §7). O bot
 * tem 10 estados; perguntar `=== "PAUSADO"` espalhado pelo codigo deixava de
 * fora PAUSADO_HUMANO (a equipe respondendo pelo app) e tratava como "ativo"
 * estados em que o hospede esta so esperando.
 */
export const BOT_STATUS_LABELS: Record<BotContactStatus, string> = {
  ATIVO: "Atendendo",
  VERIFICANDO: "Equipe verificando",
  AGUARDANDO_FICHA: "Preenchendo ficha",
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  EM_CONFIRMACAO: "Conferindo comprovante",
  PAUSADO: "Transferido",
  PAUSADO_HUMANO: "Com a equipe",
  FECHADO: "Reserva feita",
  EM_ESTADIA: "Hospedado",
  FRIO: "Esfriou",
};

/** Mesma escala de cor do funil: salvia = bot, ambar = espera/equipe, verde = fechado, neutro = frio. */
export const BOT_STATUS_TONES: Record<BotContactStatus, string> = {
  ATIVO: "bg-primary/10 text-primary",
  VERIFICANDO: "bg-warning/15 text-warning-600",
  AGUARDANDO_FICHA: "bg-primary/10 text-primary",
  AGUARDANDO_PAGAMENTO: "bg-warning/15 text-warning-600",
  EM_CONFIRMACAO: "bg-warning/15 text-warning-600",
  PAUSADO: "bg-warning/20 text-warning-600",
  PAUSADO_HUMANO: "bg-warning/20 text-warning-600",
  FECHADO: "bg-success/15 text-success-600",
  EM_ESTADIA: "bg-success/15 text-success-600",
  FRIO: "bg-default-100 text-foreground/60",
};

const COM_HUMANO = new Set<string>(["PAUSADO", "PAUSADO_HUMANO"]);
const BOT_CONDUZINDO = new Set<string>([
  "ATIVO",
  "VERIFICANDO",
  "AGUARDANDO_FICHA",
  "AGUARDANDO_PAGAMENTO",
  "EM_CONFIRMACAO",
]);

export function botStatusLabel(status: string): string {
  return (BOT_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export function botStatusTone(status: string): string {
  return (BOT_STATUS_TONES as Record<string, string>)[status] ?? "bg-default-100 text-foreground/70";
}

/** A conversa esta com a equipe (transferida ou a equipe respondeu pelo app). */
export function isWithHuman(status: string): boolean {
  return COM_HUMANO.has(status);
}

/** O bot esta conduzindo: faz sentido oferecer "Assumir conversa". */
export function canTakeOver(status: string): boolean {
  return BOT_CONDUZINDO.has(status);
}

export const OCCASION_LABELS: Record<string, string> = {
  romantica: "Romântica",
  familia: "Família",
  grupo: "Grupo",
  descanso: "Descanso",
};

export const HOLD_STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: "Disponível",
  AGUARDANDO: "Aguardando pagamento",
  CONFIRMADA: "Confirmada",
  EXPIRADA: "Expirada",
  CANCELADA: "Cancelada",
  EXCECAO: "Exceção",
};
