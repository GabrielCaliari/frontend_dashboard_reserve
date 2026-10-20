import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/src/presentation/components/organisms/hotel-portal/painel/painel-page-shell", () => ({
  PainelPageShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PainelSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const fb = {
  id: "f1", numeroContato: "551100", nomeContato: "Maria", texto: "Muito bom", resumo: null, nota: 9,
  sentimento: "positivo", checkOut: "2026-10-05", linkEnviado: false, ocorridoEm: "2026-10-06T12:00:00.000Z",
};
const h = vi.hoisted(() => ({ list: vi.fn(), total: 1 }));
vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "c1" }, isLoading: false }),
  useFeedbacks: (...args: unknown[]) => {
    h.list(...args);
    return { data: { items: [fb], total: h.total }, isLoading: false, isError: false, isFetching: false };
  },
  useFeedbacksSummary: () => ({
    data: { total: 3, porSentimento: { positivo: 2, neutro: 0, negativo: 1 }, notaMedia: 8.5, melhores: [fb], piores: [] },
  }),
}));

import FeedbacksPage from "../page";

describe("FeedbacksPage", () => {
  beforeEach(() => {
    h.total = 1;
  });

  it("manda datas puras e o `to` é o dia de hoje", () => {
    render(<FeedbacksPage />);
    const filters = h.list.mock.calls.at(-1)![1];
    expect(filters.to).toBe(new Date().toISOString().slice(0, 10));
  });

  it("mostra X de N e carrega mais aumentando o limit em 50", async () => {
    h.total = 120;
    render(<FeedbacksPage />);
    expect(screen.getByText("Mostrando 1 de 120")).toBeTruthy();
    expect(h.list.mock.calls.at(-1)![1].limit).toBe(50);
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(h.list.mock.calls.at(-1)![1].limit).toBe(100);
  });

  it("mostra nota media, destaques, lista e filtra por sentimento", async () => {
    render(<FeedbacksPage />);
    expect(screen.getByText("8,5")).toBeTruthy();
    expect(screen.getByText("Melhores da semana")).toBeTruthy();
    expect(screen.getAllByText("Nota 9").length).toBeGreaterThan(0);
    await userEvent.selectOptions(screen.getByLabelText("Sentimento"), "negativo");
    const last = h.list.mock.calls.at(-1)!;
    expect(last[0]).toBe("c1");
    expect(last[1]).toMatchObject({ sentimento: "negativo" });
  });
});
