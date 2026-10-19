import { describe, expect, it, vi } from "vitest";
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
const h = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "c1" }, isLoading: false }),
  useFeedbacks: (...args: unknown[]) => {
    h.list(...args);
    return { data: { items: [fb], total: 1 }, isLoading: false, isError: false };
  },
  useFeedbacksSummary: () => ({
    data: { total: 3, porSentimento: { positivo: 2, neutro: 0, negativo: 1 }, notaMedia: 8.5, melhores: [fb], piores: [] },
  }),
}));

import FeedbacksPage from "../page";

describe("FeedbacksPage", () => {
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
