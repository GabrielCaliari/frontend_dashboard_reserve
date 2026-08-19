import { describe, expect, it } from "vitest";
import { AUDIENCE_LABELS, FUNNEL_STAGES, moveLeadInBoard, stageLabel } from "../funnel-stages";
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";

describe("FUNNEL_STAGES", () => {
  it("tem os 9 estagios na ordem canonica", () => {
    expect(FUNNEL_STAGES.map((s) => s.stage)).toEqual([
      "CONTATO_INICIADO", "PUBLICO_IDENTIFICADO", "QUALIFICADO",
      "ACOMODACAO_APRESENTADA", "OFERTA_FEITA", "FECHAMENTO_INICIADO",
      "COMPROVANTE_RECEBIDO", "RESERVA_CONFIRMADA", "PERDIDO",
    ]);
  });

  it("labels pt-BR com acento", () => {
    expect(stageLabel("PUBLICO_IDENTIFICADO")).toBe("Público identificado");
    expect(stageLabel("ACOMODACAO_APRESENTADA")).toBe("Acomodação apresentada");
    expect(AUDIENCE_LABELS.HOSPEDE_EM_ESTADIA).toBe("Hóspede em estadia");
  });
});

const board: FunnelBoardColumn[] = [
  { stage: "CONTATO_INICIADO", count: 2, leads: [
    { numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: null },
    { numeroContato: "+5511888", nome: "Bia", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: "LEAD" },
  ]},
  { stage: "QUALIFICADO", count: 0, leads: [] },
];

describe("moveLeadInBoard", () => {
  it("move o lead entre colunas ajustando counts", () => {
    const next = moveLeadInBoard(board, "+5511999", "QUALIFICADO");
    expect(next[0].count).toBe(1);
    expect(next[0].leads.map((l) => l.numeroContato)).toEqual(["+5511888"]);
    expect(next[1].count).toBe(1);
    expect(next[1].leads[0].nome).toBe("Ana");
  });

  it("nao muta o board original e ignora numero desconhecido", () => {
    const next = moveLeadInBoard(board, "nao-existe", "QUALIFICADO");
    expect(next).toEqual(board);
    expect(board[0].count).toBe(2);
  });
});
