import { describe, expect, it } from "vitest";
import { summarizeFollowup } from "../followup-effectiveness-chart";

describe("summarizeFollowup", () => {
  it("agrupa por regua e calcula o percentual de resposta", () => {
    expect(
      summarizeFollowup([
        { regua: "anuncio", status: "respondeu", count: 3 },
        { regua: "anuncio", status: "sem_resposta", count: 9 },
        { regua: "pagamento", status: "respondeu", count: 1 },
      ]),
    ).toEqual([
      { regua: "Anúncio (72h)", respondeu_pct: 25 },
      { regua: "Pagamento", respondeu_pct: 100 },
    ]);
  });

  it("regua desconhecida aparece com o proprio nome", () => {
    expect(summarizeFollowup([{ regua: "nova", status: "sem_resposta", count: 2 }])).toEqual([
      { regua: "nova", respondeu_pct: 0 },
    ]);
  });
});
