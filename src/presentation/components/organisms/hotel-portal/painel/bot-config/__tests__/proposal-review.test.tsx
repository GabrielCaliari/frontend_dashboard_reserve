import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ProposalReview } from "../proposal-review";

describe("ProposalReview", () => {
  it("aprovar chama onApprove", () => {
    const onApprove = vi.fn();
    render(<ProposalReview isBusy={false} onApprove={onApprove} onReject={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /aprovar e publicar/i }));
    expect(onApprove).toHaveBeenCalled();
  });

  it("rejeitar exige o retorno para o cliente", () => {
    const onReject = vi.fn();
    render(<ProposalReview isBusy={false} onApprove={vi.fn()} onReject={onReject} />);
    fireEvent.click(screen.getByRole("button", { name: /^rejeitar$/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar rejeição/i }));
    expect(onReject).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/retorno para o cliente/i), { target: { value: "valor abaixo do custo" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar rejeição/i }));
    expect(onReject).toHaveBeenCalledWith("valor abaixo do custo");
  });
});
