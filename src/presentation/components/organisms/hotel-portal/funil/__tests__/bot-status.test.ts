import { describe, expect, it } from "vitest";
import {
  BOT_STATUS_LABELS,
  botStatusLabel,
  canTakeOver,
  isWithHuman,
} from "../bot-status";

describe("bot-status", () => {
  it("tem rotulo para os 10 estados do contrato", () => {
    expect(BOT_STATUS_LABELS).toEqual({
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
    });
  });

  it("estado desconhecido cai no proprio texto, sem quebrar", () => {
    expect(botStatusLabel("NOVO_ESTADO")).toBe("NOVO_ESTADO");
  });

  it("com humano sao os dois estados pausados", () => {
    expect(isWithHuman("PAUSADO")).toBe(true);
    expect(isWithHuman("PAUSADO_HUMANO")).toBe(true);
    expect(isWithHuman("ATIVO")).toBe(false);
    expect(isWithHuman("AGUARDANDO_PAGAMENTO")).toBe(false);
  });

  it("so da para assumir quando o bot esta conduzindo a conversa", () => {
    for (const s of ["ATIVO", "VERIFICANDO", "AGUARDANDO_FICHA", "AGUARDANDO_PAGAMENTO", "EM_CONFIRMACAO"]) {
      expect(canTakeOver(s)).toBe(true);
    }
    for (const s of ["PAUSADO", "PAUSADO_HUMANO", "FECHADO", "EM_ESTADIA", "FRIO"]) {
      expect(canTakeOver(s)).toBe(false);
    }
  });
});
