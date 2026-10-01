import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LinkCycleStrip } from "../link-cycle-strip";

describe("LinkCycleStrip", () => {
  it("mostra cliques, conversas e reservas com a taxa de cada passo", () => {
    render(<LinkCycleStrip ciclo={{ cliques: 200, conversas: 50, reservas: 5 }} />);
    expect(screen.getByText("200")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("25% dos cliques")).toBeInTheDocument();
    expect(screen.getByText("10% das conversas")).toBeInTheDocument();
  });

  it("sem cliques nao divide por zero", () => {
    render(<LinkCycleStrip ciclo={{ cliques: 0, conversas: 0, reservas: 0 }} />);
    expect(screen.getByText("0% dos cliques")).toBeInTheDocument();
  });
});
