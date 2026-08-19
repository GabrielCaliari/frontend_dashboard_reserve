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
