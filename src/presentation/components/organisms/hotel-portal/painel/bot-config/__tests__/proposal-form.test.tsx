import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProposalForm, isCentsKey, reaisToCents } from "../proposal-form";

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
      valor_proposto: 90, justificativa: "hóspedes pedem mais prazo",
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

describe("F3 · valores em reais", () => {
  it.each([["339", 33900], ["339,90", 33990], ["1.339,90", 133990], ["339.9", 33990], ["abc", null], ["", null]])(
    "reaisToCents(%p) = %p", (input, expected) => expect(reaisToCents(input as string)).toBe(expected),
  );
  it("identifica chaves de centavos", () => {
    expect(isCentsKey("valor_taxa_pet_cents")).toBe(true);
    expect(isCentsKey("tarifa:361057:A")).toBe(true);
    expect(isCentsKey("hold_min_cartao")).toBe(false);
  });
  it("valor_taxa_pet_cents digitado 50 chega como 5000 com previa R$ 50,00", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("O que muda"), "valor_taxa_pet_cents");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "50");
    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor_proposto: 5000 }));
  });
  it("hold_min_cartao 30 vai como numero", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.selectOptions(screen.getByLabelText("Categoria"), "policies");
    await userEvent.type(screen.getByLabelText("O que muda"), "hold_min_cartao");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "30");
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ valor_proposto: 30 }));
  });

  it("valor atual que nao e reais valido e descartado em chaves de centavos", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("O que muda"), "valor_taxa_pet_cents");
    await userEvent.type(screen.getByLabelText(/Valor atual/), "1.339");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "50");
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit.mock.calls[0][0].valor_atual).toBeUndefined();
    expect(onSubmit.mock.calls[0][0].valor_proposto).toBe(5000);
  });
  it("valor atual valido em reais vira centavos", async () => {
    const onSubmit = vi.fn();
    render(<ProposalForm onSubmit={onSubmit} isSubmitting={false} />);
    await userEvent.type(screen.getByLabelText("O que muda"), "valor_taxa_pet_cents");
    await userEvent.type(screen.getByLabelText(/Valor atual/), "30");
    await userEvent.type(screen.getByLabelText(/Novo valor/), "50");
    await userEvent.click(screen.getByRole("button", { name: /Enviar para aprovação/ }));
    expect(onSubmit.mock.calls[0][0].valor_atual).toBe(3000);
  });
});
