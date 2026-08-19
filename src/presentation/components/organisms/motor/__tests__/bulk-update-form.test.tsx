import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BulkUpdateForm } from "../bulk-update-form";

const mutateAsync = vi.fn();
vi.mock("@/src/shared/hooks/motor", () => ({
  useBulkDailyInventory: () => ({ mutateAsync, isPending: false }),
  useMotorRoomTypes: () => ({
    data: [{ id: "rt1", nome: "Suite Casal", units: [] }, { id: "rt2", nome: "Teste", units: [] }],
    isLoading: false, isError: false,
  }),
}));

describe("BulkUpdateForm", () => {
  it("preview chama a mutation com dry_run e mostra o resumo", async () => {
    mutateAsync.mockResolvedValue({ total_datas: 10, atualizar: 8, criar: 2, ignoradas_sem_preco: 0, aplicado: false });
    render(<BulkUpdateForm tenantId="tenant_1" canManage />);
    fireEvent.click(screen.getByLabelText("Suite Casal"));
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2026-09-01" } });
    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2026-09-30" } });
    fireEvent.change(screen.getByLabelText(/preco\/noite/i), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: /pre-visualizar/i }));
    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ dry_run: true, preco: 400 })));
    expect(await screen.findByText(/8 datas atualizadas/i)).toBeInTheDocument();
  });

  it("aplicar so habilita depois do preview e envia sem dry_run", async () => {
    mutateAsync.mockResolvedValue({ total_datas: 10, atualizar: 8, criar: 2, ignoradas_sem_preco: 0, aplicado: true });
    render(<BulkUpdateForm tenantId="tenant_1" canManage />);
    expect(screen.getByRole("button", { name: /aplicar/i })).toBeDisabled();
  });

  it("sem permissao mostra aviso e nenhum form", () => {
    render(<BulkUpdateForm tenantId="tenant_1" canManage={false} />);
    expect(screen.getByText(/permissao/i)).toBeInTheDocument();
  });
});
