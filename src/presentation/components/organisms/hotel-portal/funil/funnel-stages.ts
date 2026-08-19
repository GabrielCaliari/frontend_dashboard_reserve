import type { BotContactAudience, FunnelStage } from "@/src/shared/domain/types/@hotel-painel";

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
