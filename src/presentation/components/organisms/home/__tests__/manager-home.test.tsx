import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ManagerHome } from "../manager-home";

vi.mock("@/src/shared/hooks/hotel-portal", () => ({
  useActiveHotelClient: () => ({ data: { id: "client_1", hotel_name: "Pousada Dona Tereza" }, isLoading: false, isError: false }),
  useHotelHome: () => ({
    data: {
      period: { from: "2026-08-01", to: "2026-08-31" },
      funil: {
        conversasIniciadas: { value: 42, previous: null, delta: null, source: "auto" },
        distribuicaoFunil: [{ stage: "RESERVA_CONFIRMADA", count: 5 }],
        leadsProntos: 7, taxaQualificacao: 0.5, contatosPausados: 0,
        handoff: { total: 0, taxaHandover: 0, motivos: [], tempoMedioComBotSegundos: null },
      },
      motor: {
        receita: 10170, reservas: 5, ticket_medio: 2034, room_nights: 12,
        canceladas: { quantidade: 1, valor: 320 },
        a_recuperar: { quantidade: 4, valor: 1280 },
        receita_bot: 8000,
        por_origem: [{ origem: "BOT_WHATSAPP", reservas: 4, receita: 8000 }],
      },
    },
    isLoading: false, isError: false,
  }),
  useHotelPortalDashboard: () => ({
    data: {
      kpi: { direct_bookings: 3, ota_bookings: 2, direct_revenue: 6000, ota_revenue: 4000, commission_recovered_month: 500, commission_recovered_total: 2000, commission_projected_annual: 6000, occupancy_rate: 62, target_occupancy: 70, target_direct_pct: 60, site_visitors: 0, site_conversion_rate: 0 },
      timeseries: [], contract_start: "2026-01-01", ota_data_missing: false,
    },
    isLoading: false, isError: false,
  }),
}));

describe("ManagerHome", () => {
  it("mostra funil, motor, canais e ocupacao numa tela so", () => {
    render(<ManagerHome />);
    expect(screen.getByText(/conversas iniciadas/i)).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText(/a recuperar/i)).toBeInTheDocument();
    expect(screen.getByText(/gerado pelo bot/i)).toBeInTheDocument();
    expect(screen.getByText(/ocupa/i)).toBeInTheDocument();
  });
});
