import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConversationTranscript } from "../conversation-transcript";
import type { ConversationMessage } from "@/src/shared/domain/types/@hotel-painel";

const msg = (over: Partial<ConversationMessage>): ConversationMessage => ({
  role: "user",
  tipo: "texto",
  contentPreview: null,
  ocorridoEm: "2026-10-19T12:00:00",
  ...over,
});

describe("ConversationTranscript", () => {
  const scrollIntoView = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-19T15:00:00"));
    Element.prototype.scrollIntoView = scrollIntoView;
  });
  afterEach(() => {
    vi.useRealTimers();
    scrollIntoView.mockClear();
  });

  it("mostra o texto inteiro preservando quebras de linha e a hora", () => {
    render(
      <ConversationTranscript
        messages={[msg({ content: "Linha 1\nLinha 2", contentPreview: "Linha 1", ocorridoEm: "2026-10-19T09:05:00" })]}
      />,
    );
    const p = screen.getByText(/Linha 1/);
    expect(p).toHaveClass("whitespace-pre-wrap");
    expect(p.textContent).toBe("Linha 1\nLinha 2");
    expect(screen.getByText("09:05")).toBeInTheDocument();
  });

  it("áudio mostra a transcrição", () => {
    render(<ConversationTranscript messages={[msg({ tipo: "audio", mediaKind: "audio", mediaText: "quero reservar" })]} />);
    expect(screen.getByText("🎤 transcrição: quero reservar")).toBeInTheDocument();
  });

  it("imagem mostra descrição e legenda", () => {
    render(
      <ConversationTranscript
        messages={[msg({ tipo: "imagem", mediaKind: "image", mediaText: "uma suíte", caption: "Olha esta" })]}
      />,
    );
    expect(screen.getByText("🖼 descrição: uma suíte")).toBeInTheDocument();
    expect(screen.getByText("Olha esta")).toBeInTheDocument();
  });

  it("outros tipos de mídia mostram o rótulo", () => {
    render(<ConversationTranscript messages={[msg({ mediaKind: "video" })]} />);
    expect(screen.getByText("Vídeo")).toBeInTheDocument();
  });

  it("'[unsupported]' do WhatsApp vira explicação em vez do colchete", () => {
    render(
      <ConversationTranscript
        messages={[
          msg({ content: "[unsupported]" }),
          msg({ content: "[sticker]", ocorridoEm: "2026-10-19T12:10:00" }),
          msg({ content: "[unsupported] Message type unknown", ocorridoEm: "2026-10-19T12:20:00" }),
        ]}
      />,
    );
    expect(screen.queryByText("[unsupported]")).not.toBeInTheDocument();
    expect(screen.getAllByText(/não entrega ao bot/)).toHaveLength(2);
    expect(screen.getByText(/Message type unknown/)).toBeInTheDocument();
    expect(screen.getByText("Figurinha")).toBeInTheDocument();
  });

  it("linha de sistema é centralizada e sem bolha", () => {
    render(
      <ConversationTranscript
        messages={[msg({ role: "assistant", tipo: "sistema", content: "Jornada: avaliação enviada (modelo avaliacao)" })]}
      />,
    );
    const el = screen.getByText("Jornada: avaliação enviada (modelo avaliacao)");
    expect(el).toHaveClass("self-center");
    expect(el).not.toHaveClass("bg-primary/10");
  });

  it("separa dias com Hoje, Ontem e data completa", () => {
    render(
      <ConversationTranscript
        messages={[
          msg({ content: "a", ocorridoEm: "2026-10-10T10:00:00" }),
          msg({ content: "b", ocorridoEm: "2026-10-18T10:00:00" }),
          msg({ content: "c", ocorridoEm: "2026-10-19T10:00:00" }),
          msg({ content: "d", ocorridoEm: "2026-10-19T11:00:00" }),
        ]}
      />,
    );
    const seps = screen.getAllByTestId("day-separator").map((e) => e.textContent);
    expect(seps).toEqual(["10/10/2026", "Ontem", "Hoje"]);
  });

  it("botão de anteriores aparece só com hasMore e chama onLoadMore", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(<ConversationTranscript messages={[msg({ content: "x" })]} />);
    expect(screen.queryByText("Carregar mensagens anteriores")).not.toBeInTheDocument();
    rerender(<ConversationTranscript messages={[msg({ content: "x" })]} hasMore onLoadMore={onLoadMore} />);
    fireEvent.click(screen.getByText("Carregar mensagens anteriores"));
    expect(onLoadMore).toHaveBeenCalled();
  });

  it("rola ao fim só na primeira carga", () => {
    const { rerender } = render(<ConversationTranscript messages={[msg({ content: "x" })]} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    rerender(<ConversationTranscript messages={[msg({ content: "antiga" }), msg({ content: "x" })]} />);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
