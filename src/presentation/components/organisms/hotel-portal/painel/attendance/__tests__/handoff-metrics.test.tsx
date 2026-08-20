import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HandoffMetrics } from "../handoff-metrics";

describe("HandoffMetrics", () => {
  it("mostra taxa, tempo com o bot e motivos ranqueados", () => {
    render(
      <HandoffMetrics
        handoff={{
          total: 3,
          taxaHandover: 0.75,
          tempoMedioComBotSegundos: 1200,
          motivos: [
            { motivo: "pediu_humano", count: 2 },
            { motivo: "nao_soube", count: 1 },
          ],
        }}
      />,
    );
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("20 min")).toBeInTheDocument();
    expect(screen.getByText("pediu humano")).toBeInTheDocument();
    expect(screen.getByText("nao soube")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("sem handoff no periodo mostra estado vazio", () => {
    render(<HandoffMetrics handoff={{ total: 0, taxaHandover: 0, tempoMedioComBotSegundos: null, motivos: [] }} />);
    expect(screen.getByText(/nenhuma transferência/i)).toBeInTheDocument();
  });
});
