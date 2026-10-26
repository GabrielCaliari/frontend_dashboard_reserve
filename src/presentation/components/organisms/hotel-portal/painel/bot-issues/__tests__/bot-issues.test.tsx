import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BotIssueDetail, BotIssueItem } from "@/src/shared/domain/types/@hotel-painel";
import { BotIssuesTable } from "../bot-issues-table";
import { BotIssueDetailModal } from "../bot-issue-detail";
import { TopCodesCard } from "../top-codes-card";

const item = (over: Partial<BotIssueItem> = {}): BotIssueItem => ({
  id: "i1",
  numeroContato: "5511999990000",
  nomeContato: "Maria",
  categoria: "tecnico",
  codigo: "WF_TIMEOUT",
  gravidade: "alta",
  etapa: "COTACAO",
  workflow: "WF1",
  no: "HTTP",
  mensagem: "falhou",
  socorro: false,
  status: "ABERTO",
  ocorridoEm: "2026-10-18T12:00:00.000Z",
  ...over,
});

const detail = (over: Partial<BotIssueDetail> = {}): BotIssueDetail => ({
  ...item(),
  mensagemHospede: "Quero reservar",
  respostaBot: "Um instante",
  ultimasMensagens: [{ m: "Oi", em: "2026-10-18T11:59:00.000Z", quem: "hospede" }],
  url: "https://n8n.example/exec/1",
  ...over,
});

describe("BotIssuesTable", () => {
  it("mostra linhas, rotulos e selo Socorro e abre a linha", async () => {
    const onOpen = vi.fn();
    render(
      <BotIssuesTable
        items={[
          item(),
          item({ id: "i2", socorro: true, nomeContato: null, categoria: "socorro", gravidade: "baixa", status: "VISTO", codigo: "SOS" }),
        ]}
        onOpen={onOpen}
      />,
    );
    expect(screen.getByText("Alta")).toBeTruthy();
    expect(screen.getByText("Baixa")).toBeTruthy();
    expect(screen.getByText("Socorro")).toBeTruthy();
    expect(screen.getByText("Visto")).toBeTruthy();
    await userEvent.click(screen.getByText("Maria"));
    expect(onOpen).toHaveBeenCalledWith("i1");
  });
});

describe("TopCodesCard", () => {
  it("lista no maximo 5 codigos", () => {
    const porCodigo = Array.from({ length: 7 }, (_, i) => ({ codigo: `C${i}`, categoria: "tecnico", quantidade: 10 - i }));
    render(<TopCodesCard porCodigo={porCodigo} />);
    expect(screen.getByText("Mais frequentes na semana")).toBeTruthy();
    expect(screen.getByText("C4")).toBeTruthy();
    expect(screen.queryByText("C5")).toBeNull();
  });
});

describe("BotIssueDetailModal", () => {
  const base = { open: true, onClose: vi.fn(), isUpdating: false };

  it("mostra conteudo e botoes de status com permissao; link n8n so para super admin", async () => {
    const onChangeStatus = vi.fn();
    render(<BotIssueDetailModal {...base} onChangeStatus={onChangeStatus} issue={detail()} canManage isSuperAdmin />);
    expect(screen.getByText("Quero reservar")).toBeTruthy();
    expect(screen.getByText("Um instante")).toBeTruthy();
    expect(screen.getByText("Oi")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Abrir conversa/ }).getAttribute("href")).toBe("/dashboard/hotel/atendimento/conversas?contato=5511999990000");
    expect(screen.getByRole("link", { name: /n8n/i })).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Marcar como visto" }));
    expect(onChangeStatus).toHaveBeenCalledWith("i1", "VISTO");
    await userEvent.click(screen.getByRole("button", { name: "Marcar como corrigido" }));
    expect(onChangeStatus).toHaveBeenCalledWith("i1", "CORRIGIDO");
  });

  it("esconde botoes sem permissao e link n8n sem super admin", () => {
    render(<BotIssueDetailModal {...base} onChangeStatus={vi.fn()} issue={detail()} canManage={false} isSuperAdmin={false} />);
    expect(screen.queryByRole("button", { name: "Marcar como visto" })).toBeNull();
    expect(screen.queryByRole("link", { name: /n8n/i })).toBeNull();
  });
});
