import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalForm } from "../proposal-form";

describe("ProposalForm", () => {
  it("envia a justificativa do cliente junto da proposta", () => {
    const onSubmit = vi.fn();
    render(<ProposalForm isSubmitting={false} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/o que muda/i), { target: { value: "hold_min_pix_manual" } });
    fireEvent.change(screen.getByLabelText(/novo valor/i), { target: { value: "90" } });
    fireEvent.change(screen.getByLabelText(/por que mudar/i), { target: { value: "hóspedes pedem mais prazo" } });
    fireEvent.click(screen.getByRole("button", { name: /enviar para aprovação/i }));
    expect(onSubmit).toHaveBeenCalledWith({
      campo: "hold_min_pix_manual", categoria: "pricing", valor_atual: undefined,
      valor_proposto: "90", justificativa: "hóspedes pedem mais prazo",
    });
  });

  it("sugere as chaves que o bot aceita para a categoria escolhida", () => {
    render(<ProposalForm isSubmitting={false} onSubmit={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/categoria/i), { target: { value: "policies" } });
    const opcoes = [...document.querySelectorAll("#proposal-campo-sugestoes option")].map((o) =>
      o.getAttribute("value"),
    );
    expect(opcoes).toEqual(["hold_min_pix_manual", "hold_min_cartao", "hold_min_pix_link"]);
  });
});
