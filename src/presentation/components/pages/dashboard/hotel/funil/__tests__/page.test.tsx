import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HotelFunilPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "client_1", hotel_name: "Pousada" }, isLoading: false }),
  useHotelFunnelBoard: () => ({
    data: [
      { stage: "CONTATO_INICIADO", count: 1, leads: [{ numeroContato: "+5511999", nome: "Ana", acomodacaoInteresse: null, datasInteresse: null, tipoPublico: null }] },
      { stage: "PUBLICO_IDENTIFICADO", count: 0, leads: [] },
      { stage: "QUALIFICADO", count: 0, leads: [] },
      { stage: "ACOMODACAO_APRESENTADA", count: 0, leads: [] },
      { stage: "OFERTA_FEITA", count: 0, leads: [] },
      { stage: "FECHAMENTO_INICIADO", count: 0, leads: [] },
      { stage: "COMPROVANTE_RECEBIDO", count: 0, leads: [] },
      { stage: "RESERVA_CONFIRMADA", count: 0, leads: [] },
      { stage: "PERDIDO", count: 0, leads: [] },
    ],
    isLoading: false, isError: false,
  }),
  useHotelFunnelMetrics: () => ({ data: undefined }),
  useMoveFunnelStage: () => mutation,
}));

describe("HotelFunilPage", () => {
  it("renderiza o kanban dos 9 estagios com acao de mover", () => {
    render(<HotelFunilPage />);
    expect(screen.getAllByTestId("coluna-header")).toHaveLength(9);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mover ana/i })).toBeInTheDocument();
  });
});
