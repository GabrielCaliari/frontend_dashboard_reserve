import type {
  BotContactAudience,
  FunnelBoardColumn,
  FunnelStage,
} from "@/src/shared/domain/types/@hotel-painel";

export const FUNNEL_STAGES: { stage: FunnelStage; label: string }[] = [
  { stage: "CONTATO_INICIADO", label: "Contato iniciado" },
  { stage: "PUBLICO_IDENTIFICADO", label: "Público identificado" },
  { stage: "QUALIFICADO", label: "Qualificado" },
  { stage: "ACOMODACAO_APRESENTADA", label: "Acomodação apresentada" },
  { stage: "OFERTA_FEITA", label: "Oferta feita" },
  { stage: "FECHAMENTO_INICIADO", label: "Fechamento iniciado" },
  { stage: "COMPROVANTE_RECEBIDO", label: "Comprovante recebido" },
  { stage: "RESERVA_CONFIRMADA", label: "Reserva confirmada" },
  { stage: "PERDIDO", label: "Perdido" },
];

export const AUDIENCE_LABELS: Record<BotContactAudience, string> = {
  LEAD: "Lead",
  HOSPEDE_EM_ESTADIA: "Hóspede em estadia",
  MENSALISTA: "Mensalista",
  MARINA: "Marina",
  EQUIPE: "Equipe",
};

export function stageLabel(stage: FunnelStage): string {
  return FUNNEL_STAGES.find((s) => s.stage === stage)?.label ?? stage;
}

/**
 * Cor por dono do estagio, compartilhada entre o kanban e a lista de
 * conversas: neutro = topo do funil, primario (salvia) = trabalho da Reserve,
 * ambar = negociacao do hotel, verde = fechado, vermelho = perdido.
 */
export const STAGE_ACCENTS: Record<FunnelStage, string> = {
  CONTATO_INICIADO: "bg-default-400",
  PUBLICO_IDENTIFICADO: "bg-default-400",
  QUALIFICADO: "bg-primary",
  ACOMODACAO_APRESENTADA: "bg-warning",
  OFERTA_FEITA: "bg-warning",
  FECHAMENTO_INICIADO: "bg-warning",
  COMPROVANTE_RECEBIDO: "bg-success",
  RESERVA_CONFIRMADA: "bg-success",
  PERDIDO: "bg-danger",
};

/** Versao pill (fundo + texto) da mesma escala, para badges de estagio. */
export const STAGE_TONES: Record<FunnelStage, string> = {
  CONTATO_INICIADO: "bg-default-100 text-foreground/70",
  PUBLICO_IDENTIFICADO: "bg-default-100 text-foreground/70",
  QUALIFICADO: "bg-primary/10 text-primary",
  ACOMODACAO_APRESENTADA: "bg-warning/15 text-warning-600",
  OFERTA_FEITA: "bg-warning/15 text-warning-600",
  FECHAMENTO_INICIADO: "bg-warning/15 text-warning-600",
  COMPROVANTE_RECEBIDO: "bg-success/15 text-success-600",
  RESERVA_CONFIRMADA: "bg-success/15 text-success-600",
  PERDIDO: "bg-danger/10 text-danger",
};

export const AUDIENCE_TONES: Record<BotContactAudience, string> = {
  LEAD: "bg-primary/10 text-primary",
  HOSPEDE_EM_ESTADIA: "bg-success/15 text-success-600",
  MENSALISTA: "bg-secondary/20 text-secondary-600",
  MARINA: "bg-warning/20 text-warning-600",
  EQUIPE: "bg-default-200 text-foreground/70",
};

/** Iniciais para o avatar do contato; sem nome, os 2 ultimos digitos do numero. */
export function contactInitials(nome: string | null, numeroContato: string): string {
  if (!nome || !nome.trim()) return numeroContato.replace(/\D/g, "").slice(-2) || "?";
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return `${primeira}${segunda}`.toUpperCase();
}

// atualizacao otimista do kanban: tira o lead da coluna de origem e poe no
// topo da coluna destino; counts acompanham. Puro para ser testavel.
export function moveLeadInBoard(
  board: FunnelBoardColumn[],
  numeroContato: string,
  paraEstagio: FunnelStage,
): FunnelBoardColumn[] {
  const origem = board.find((c) => c.leads.some((l) => l.numeroContato === numeroContato));
  if (!origem || origem.stage === paraEstagio) return board;
  const lead = origem.leads.find((l) => l.numeroContato === numeroContato)!;
  return board.map((c) => {
    if (c.stage === origem.stage) {
      return { ...c, count: Math.max(0, c.count - 1), leads: c.leads.filter((l) => l.numeroContato !== numeroContato) };
    }
    if (c.stage === paraEstagio) {
      return { ...c, count: c.count + 1, leads: [lead, ...c.leads] };
    }
    return c;
  });
}
