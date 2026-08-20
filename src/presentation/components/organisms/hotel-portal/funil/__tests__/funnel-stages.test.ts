import { describe, expect, it } from "vitest";
import { AUDIENCE_LABELS, FUNNEL_STAGES, formatBRL, moveLeadInBoard, stageLabel, waitingLabel } from "../funnel-stages";
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
  { stage: "CONTATO_INICIADO", count: 2, valorAberto: 0, valorConfirmado: 0, leads: [
    { numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: null, statusBot: "ATIVO", aguardandoDesde: null, valorCotacao: null, etiqueta: null },
    { numeroContato: "+5511888", nome: "Bia", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: "LEAD", statusBot: "ATIVO", aguardandoDesde: null, valorCotacao: null, etiqueta: null },
  ]},
  { stage: "QUALIFICADO", count: 0, valorAberto: 0, valorConfirmado: 0, leads: [] },
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

describe("formatBRL", () => {
  it("formata reais no padrao pt-BR", () => {
    expect(formatBRL(1250)).toBe("R$ 1.250,00");
    expect(formatBRL(320.5)).toBe("R$ 320,50");
  });
});

describe("waitingLabel", () => {
  const now = new Date("2026-08-20T12:00:00Z");
  it("null sem data", () => {
    expect(waitingLabel(null, now)).toBeNull();
  });
  it("minutos, horas e dias", () => {
    expect(waitingLabel("2026-08-20T11:58:00Z", now)).toBe("há 2 min");
    expect(waitingLabel("2026-08-20T09:00:00Z", now)).toBe("há 3 h");
    expect(waitingLabel("2026-08-17T12:00:00Z", now)).toBe("há 3 d");
  });
  it("menos de 1 minuto e 'agora'", () => {
    expect(waitingLabel("2026-08-20T11:59:40Z", now)).toBe("agora");
  });
});
