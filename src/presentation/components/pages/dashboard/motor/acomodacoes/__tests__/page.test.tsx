import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorAcomodacoesPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({
    tenantId: "tenant_1",
    hasPermission: () => true,
  }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorRoomTypes: () => ({
    data: [
      {
        id: "rt_1",
        nome: "Suíte Casal",
        descricao_curta: null,
        capacidade_base: 2,
        capacidade_max: 3,
        valor_pessoa_adicional: 80,
        aceita_pets: true,
        taxa_pet_dia: 50,
        ordem: 0,
        ativo: true,
        units: [
          { id: "u_1", room_type_id: "rt_1", identificador: "Casal 01", ativo: true },
          { id: "u_2", room_type_id: "rt_1", identificador: "Casal 02", ativo: true },
        ],
      },
    ],
    isLoading: false,
    isError: false,
  }),
  useCreateRoomType: () => mutation,
  useUpdateRoomType: () => mutation,
  useCreateUnit: () => mutation,
  useUpdateUnit: () => mutation,
}));

describe("MotorAcomodacoesPage", () => {
  it("lista os tipos com capacidade e unidades", () => {
    render(<MotorAcomodacoesPage />);
    expect(screen.getByText("Acomodações")).toBeInTheDocument();
    expect(screen.getByText("Suíte Casal")).toBeInTheDocument();
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    expect(screen.getByText("Casal 02")).toBeInTheDocument();
    expect(screen.getByText(/2 \+ 1 pessoas/)).toBeInTheDocument();
  });
});
