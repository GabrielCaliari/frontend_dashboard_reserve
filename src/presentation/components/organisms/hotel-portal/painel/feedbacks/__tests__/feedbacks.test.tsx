import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FeedbackItem } from "@/src/shared/domain/types/@hotel-painel";
import { FeedbackList } from "../feedback-list";
import { FeedbackHighlights } from "../feedback-highlights";

const item = (over: Partial<FeedbackItem> = {}): FeedbackItem => ({
  id: "f1",
  numeroContato: "5511999990000",
  nomeContato: "Maria",
  texto: "Adoramos a estadia",
  resumo: null,
  nota: 10,
  sentimento: "positivo",
  checkOut: "2026-10-05",
  linkEnviado: true,
  ocorridoEm: "2026-10-06T12:00:00.000Z",
  ...over,
});

describe("FeedbackList", () => {
  it("mostra sentimento, nota, check-out sem deslocar fuso, selo e link", () => {
    render(
      <FeedbackList
        items={[
          item(),
          item({
            id: "f2",
            sentimento: "negativo",
            nota: null,
            texto: null,
            resumo: "Reclamou do ruido",
            checkOut: "2026-01-01",
            linkEnviado: false,
            nomeContato: null,
          }),
          item({ id: "f3", sentimento: "neutro" }),
        ]}
      />,
    );
    expect(screen.getByText("Positivo")).toBeTruthy();
    expect(screen.getByText("Negativo")).toBeTruthy();
    expect(screen.getByText("Neutro")).toBeTruthy();
    expect(screen.getAllByText("Nota 10").length).toBe(2);
    expect(screen.getAllByText(/05\/10\/2026/).length).toBe(2);
    expect(screen.getByText(/01\/01\/2026/)).toBeTruthy();
    expect(screen.getByText("Reclamou do ruido")).toBeTruthy();
    expect(screen.getAllByText("Link de avaliação enviado").length).toBe(2);
    expect(screen.getAllByRole("link", { name: /Abrir conversa/ })[0].getAttribute("href")).toBe(
      "/dashboard/hotel/atendimento/conversas?contato=5511999990000",
    );
  });
});

describe("FeedbackHighlights", () => {
  it("mostra melhores e piores da semana e vazio", () => {
    render(<FeedbackHighlights melhores={[item({ texto: "Excelente" })]} piores={[]} />);
    expect(screen.getByText("Melhores da semana")).toBeTruthy();
    expect(screen.getByText("Piores da semana")).toBeTruthy();
    expect(screen.getByText("Excelente")).toBeTruthy();
    expect(screen.getByText("Nenhum feedback na semana.")).toBeTruthy();
  });
});
