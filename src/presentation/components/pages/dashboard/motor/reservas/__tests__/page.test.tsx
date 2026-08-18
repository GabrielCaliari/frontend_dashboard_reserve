import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorReservasPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorReservations: () => ({
    data: [
      {
        id: "r_1",
        room_type_id: "rt_1",
        unit_id: "u_1",
        checkin: "2026-09-05",
        checkout: "2026-09-07",
        status: "CONFIRMADA",
        origem: "BOT_WHATSAPP",
        hospede_nome: "Maria Silva",
        hospede_telefone: "5535999990000",
        hospede_email: null,
        adultos: 2,
        criancas: 0,
        pets: 0,
        valor_total: 678,
        valor_pago: 339,
        saldo_checkin: 339,
        forma_pagamento: "PIX_50",
        observacoes: null,
        created_at: "2026-08-18T10:00:00.000Z",
        unit: { id: "u_1", room_type_id: "rt_1", identificador: "Casal 01", ativo: true },
        room_type: { nome: "Suíte Casal" },
      },
    ],
    isLoading: false,
    isError: false,
  }),
  useMotorReservation: () => ({ data: undefined, isLoading: false, isError: false }),
  useRescheduleReservation: () => mutation,
  useCancelReservation: () => mutation,
}));

describe("MotorReservasPage", () => {
  it("lista reservas com hospede, unidade, status e saldo do check-in", () => {
    render(<MotorReservasPage />);
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    expect(screen.getByText("CONFIRMADA")).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?339,00/)).toBeInTheDocument();
  });
});
