import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FunnelBoard, resolveDrop } from "../funnel-board";
import type { FunnelBoardColumn } from "@/src/shared/domain/types/@hotel-painel";
import type { DragEndEvent } from "@dnd-kit/core";

const lead = {
  numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null,
  tipoPublico: "MENSALISTA" as const, statusBot: "PAUSADO" as const,
  aguardandoDesde: new Date(Date.now() - 5 * 60_000).toISOString(),
  valorCotacao: 1250, etiqueta: "RECUPERAR" as const,
};
const columns: FunnelBoardColumn[] = [
  { stage: "CONTATO_INICIADO", count: 1, valorAberto: 1250, valorConfirmado: 0, leads: [lead] },
  ...[
    "PUBLICO_IDENTIFICADO", "QUALIFICADO", "ACOMODACAO_APRESENTADA", "OFERTA_FEITA",
    "FECHAMENTO_INICIADO", "COMPROVANTE_RECEBIDO", "RESERVA_CONFIRMADA", "PERDIDO",
  ].map((stage) => ({ stage: stage as FunnelBoardColumn["stage"], count: 0, valorAberto: 0, valorConfirmado: 0, leads: [] })),
];

describe("FunnelBoard", () => {
  it("datasInteresse nao-string (payload legado do bot) nao quebra a renderizacao", () => {
    // defesa em profundidade: o backend normaliza para string, mas cache
    // antigo do React Query ainda pode servir o objeto {checkin, checkout}
    const legado: FunnelBoardColumn[] = [
      {
        ...columns[0],
        leads: [{
          ...lead,
          datasInteresse: { checkin: "2026-09-12", checkout: "2026-09-15" } as unknown as string,
        }],
      },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={legado} canManage onMove={vi.fn()} />);
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("renderiza as 9 colunas na ordem e o badge de subtipo", () => {
    render(<FunnelBoard columns={columns} canManage onMove={vi.fn()} />);
    const headers = screen.getAllByTestId("coluna-header").map((h) => h.textContent);
    expect(headers[0]).toContain("Contato iniciado");
    expect(headers[8]).toContain("Perdido");
    expect(headers).toHaveLength(9);
    expect(screen.getByText("Mensalista")).toBeInTheDocument();
  });

  it("menu do card move direto para estagio comum", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Qualificado"));
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "QUALIFICADO" }),
    );
  });

  it("mover para perdido exige motivo no modal", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Perdido"));
    const confirmar = await screen.findByRole("button", { name: /confirmar/i });
    fireEvent.click(confirmar);
    expect(onMove).not.toHaveBeenCalled(); // sem motivo nao envia
    fireEvent.change(screen.getByLabelText(/motivo da perda/i), { target: { value: "sem resposta" } });
    fireEvent.click(confirmar);
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "PERDIDO", motivo: "sem resposta" }),
    );
  });

  it("publico identificado oferece subtipo com pular", async () => {
    const onMove = vi.fn().mockResolvedValue(undefined);
    render(<FunnelBoard columns={columns} canManage onMove={onMove} />);
    fireEvent.click(screen.getByRole("button", { name: /mover ana/i }));
    fireEvent.click(await screen.findByText("Público identificado"));
    fireEvent.click(await screen.findByRole("button", { name: /pular/i }));
    await waitFor(() =>
      expect(onMove).toHaveBeenCalledWith("+5511999", { para_estagio: "PUBLICO_IDENTIFICADO" }),
    );
  });

  it("sem canManage nao ha menu de mover", () => {
    render(<FunnelBoard columns={columns} canManage={false} onMove={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /mover ana/i })).not.toBeInTheDocument();
  });

  it("cabecalho da coluna mostra R$ aberto e confirmado quando ha valor", () => {
    const comConfirmado = [
      { ...columns[0], valorConfirmado: 600 },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={comConfirmado} canManage onMove={vi.fn()} />);
    const header = screen.getAllByTestId("coluna-header")[0];
    expect(header).toHaveTextContent("R$ 1.250,00 em aberto");
    expect(header).toHaveTextContent("R$ 600,00 confirmado");
    // coluna vazia nao polui com "R$ 0,00"
    expect(screen.getAllByTestId("coluna-header")[1]).not.toHaveTextContent("R$");
  });

  it("card mostra valor da cotacao, espera, etiqueta de recuperacao e quem esta com a bola", () => {
    render(<FunnelBoard columns={columns} canManage onMove={vi.fn()} />);
    expect(screen.getByText("R$ 1.250,00")).toBeInTheDocument();
    expect(screen.getByText("há 5 min")).toBeInTheDocument();
    expect(screen.getByText("Recuperar")).toBeInTheDocument();
    expect(screen.getByLabelText("Com humano")).toBeInTheDocument();
  });

  it("card com bot ativo mostra indicador do bot", () => {
    const ativo = [
      { ...columns[0], leads: [{ ...lead, statusBot: "ATIVO" as const, etiqueta: null }] },
      ...columns.slice(1),
    ];
    render(<FunnelBoard columns={ativo} canManage onMove={vi.fn()} />);
    expect(screen.getByLabelText("Com o bot")).toBeInTheDocument();
    expect(screen.queryByText("Recuperar")).not.toBeInTheDocument();
  });
});

describe("resolveDrop", () => {
  const evt = (activeId: string | null, overId: string | null) =>
    ({ active: activeId ? { id: activeId } : null, over: overId ? { id: overId } : null }) as unknown as DragEndEvent;

  it("extrai numero e estagios do drop valido", () => {
    expect(resolveDrop(evt("CONTATO_INICIADO|+5511999", "QUALIFICADO"))).toEqual({
      numeroContato: "+5511999", deEstagio: "CONTATO_INICIADO", paraEstagio: "QUALIFICADO",
    });
  });

  it("drop na propria coluna ou fora e null", () => {
    expect(resolveDrop(evt("QUALIFICADO|+5511999", "QUALIFICADO"))).toBeNull();
    expect(resolveDrop(evt("QUALIFICADO|+5511999", null))).toBeNull();
  });
});
