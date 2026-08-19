import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorTarifasPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorTarifas: () => ({
    data: {
      seasons: [{ id: "s_1", nome: "Alta — Julho", data_inicio: "2026-07-01", data_fim: "2026-07-31", prioridade: 1 }],
      price_rules: [
        { id: "pr_1", room_type_id: "rt_1", rate_plan_id: null, season_id: null, dow_mask: 96, preco_noite: 400, min_stay: 2 },
      ],
      policies: [
        { id: "cp_1", nome: "Padrão", dias_antecedencia_remarcacao: 7, reembolso_apos_prazo: false, taxa_noshow_percent: 100 },
      ],
      rate_plans: [],
    },
    isLoading: false,
    isError: false,
  }),
  useMotorRoomTypes: () => ({
    data: [{ id: "rt_1", nome: "Suíte Casal", units: [], capacidade_base: 2, capacidade_max: 3, valor_pessoa_adicional: 0, taxa_pet_dia: 0, aceita_pets: false, ordem: 0, ativo: true, descricao_curta: null }],
    isLoading: false,
    isError: false,
  }),
  useCreateSeason: () => mutation,
  useDeleteSeason: () => mutation,
  useCreatePriceRule: () => mutation,
  useDeletePriceRule: () => mutation,
  useCreatePolicy: () => mutation,
  useUpdatePolicy: () => mutation,
  useUpsertDailyInventory: () => mutation,
}));

describe("MotorTarifasPage", () => {
  it("mostra temporadas, regras de preco e politica", () => {
    render(<MotorTarifasPage />);
    expect(screen.getByText("Tarifas")).toBeInTheDocument();
    // O nome tambem aparece na option escondida do Select de temporada,
    // entao o assert mira a celula da tabela de temporadas.
    expect(screen.getByText("Alta — Julho", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("2026-07-01 → 2026-07-31")).toBeInTheDocument();
    expect(screen.getByText(/Sáb, Dom/)).toBeInTheDocument(); // dow_mask 96 = sab+dom
    expect(screen.getByText(/7 dias/)).toBeInTheDocument();
  });
});
