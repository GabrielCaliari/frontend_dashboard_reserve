import { describe, expect, it } from "vitest";
import { AUDIENCE_LABELS, FUNNEL_STAGES, stageLabel } from "../funnel-stages";

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
