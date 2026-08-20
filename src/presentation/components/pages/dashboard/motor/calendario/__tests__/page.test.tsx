import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MotorCalendarioPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorCalendarRange: () => ({
    data: { from: "2026-08-01", to: "2026-08-31", unidades: [{ unit_id: "u1", identificador: "Casal 1", room_type_id: "rt1", room_type_nome: "Suite Casal", dias: [{ data: "2026-08-01", estado: "LIVRE" }] }] },
    isLoading: false, isError: false,
  }),
  useMotorGrade: () => ({
    data: {
      from: "2026-08-01", to: "2026-08-31",
      room_types: [{
        room_type_id: "rt1", nome: "Suite Casal", capacidade_base: 2, capacidade_max: 3,
        valor_pessoa_adicional: 50, total_units: 1,
        dias: [{ data: "2026-08-01", preco: 320, min_stay: 1, stop_sell: false, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 1 }],
      }],
    },
    isLoading: false, isError: false,
  }),
  useCreateBlock: () => mutation,
  useCreateManualReservation: () => mutation,
  useUpsertDailyInventory: () => mutation,
  useBulkDailyInventory: () => mutation,
  useMotorRoomTypes: () => ({ data: [], isLoading: false, isError: false }),
}));

describe("MotorCalendarioPage", () => {
  it("renderiza as tres abas e a ocupacao por tipo por padrao", () => {
    render(<MotorCalendarioPage />);
    expect(screen.getByRole("tab", { name: "Ocupação" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Grade de tarifas" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Atualização em massa" })).toBeInTheDocument();
    // visao padrao agrega por tipo: mostra o nome do tipo, nao a unidade
    expect(screen.getByText("Suite Casal")).toBeInTheDocument();
    expect(screen.queryByText("Casal 1")).not.toBeInTheDocument();
  });

  it("troca para a visao por unidade", () => {
    render(<MotorCalendarioPage />);
    fireEvent.click(screen.getByRole("button", { name: "Por unidade" }));
    expect(screen.getByText("Casal 1")).toBeInTheDocument();
  });

  it("troca para a grade de tarifas", () => {
    render(<MotorCalendarioPage />);
    fireEvent.click(screen.getByRole("tab", { name: "Grade de tarifas" }));
    expect(screen.getByText("À venda")).toBeInTheDocument();
    expect(screen.getByText("2 pessoas")).toBeInTheDocument();
  });
});
