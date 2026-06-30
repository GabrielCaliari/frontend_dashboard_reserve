import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AcquisitionFunnel } from "../acquisition-funnel";
import type { FunnelStage } from "@/src/modules/portal/domain/portal-leads";

const camada1Stages: FunnelStage[] = [
  { key: "cliques", label: "Cliques", value: 850 },
  { key: "conversas", label: "Conversas iniciadas", value: 850 },
  { key: "reservas", label: "Leads gerados", value: 30 },
];

describe("AcquisitionFunnel", () => {
  it("renders every stage with its value", () => {
    render(<AcquisitionFunnel stages={camada1Stages} />);
    expect(screen.getByText("Cliques")).toBeInTheDocument();
    // cliques and conversas share the same real-world value (see portal-leads.ts
    // domain comment: a bot-filtered WhatsApp link click is already "conversa
    // iniciada"), so "850" legitimately renders twice.
    expect(screen.getAllByText("850").length).toBe(2);
    expect(screen.getByText("Leads gerados")).toBeInTheDocument();
  });

  it("draws the fronteira line after the stage marked isFronteira", () => {
    const stages: FunnelStage[] = [
      ...camada1Stages,
      { key: "prontos", label: "Prontos para fechar", value: 12, isFronteira: true },
      { key: "qualificados", label: "Reservas confirmadas", value: 8 },
    ];
    render(<AcquisitionFunnel stages={stages} />);
    expect(screen.getByTestId("fronteira-line")).toBeInTheDocument();
  });

  it("does not render a fronteira line when no stage is marked", () => {
    render(<AcquisitionFunnel stages={camada1Stages} />);
    expect(screen.queryByTestId("fronteira-line")).not.toBeInTheDocument();
  });
});
