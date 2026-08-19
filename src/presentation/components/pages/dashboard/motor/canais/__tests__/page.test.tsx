import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MotorCanaisPage from "../page";

vi.mock("@/src/modules/settings/presentation/hooks/tenant-capabilities-provider", () => ({
  useTenantCapabilities: () => ({ tenantId: "tenant_1", hasPermission: () => true }),
}));

const mutation = { mutateAsync: vi.fn(), isPending: false };

vi.mock("@/src/shared/hooks/motor", () => ({
  useMotorCanais: () => ({
    data: {
      status: "DIVERGENTE",
      conectado: true,
      reconcile_2x: true,
      beds24_property_id: "12345",
      beds24_room_id_map: { rt_1: 777 },
      last_push_at: "2026-08-18T12:00:00.000Z",
      last_webhook_at: null,
      last_reconcile_at: "2026-08-18T03:30:00.000Z",
      fila_erros: [
        { id: "q_1", room_type_id: "rt_1", range_inicio: "2026-09-01", range_fim: "2026-09-05", attempts: 5 },
      ],
    },
    isLoading: false,
    isError: false,
  }),
  useMotorRoomTypes: () => ({
    data: [{ id: "rt_1", nome: "Suíte Casal", units: [], capacidade_base: 2, capacidade_max: 3, valor_pessoa_adicional: 0, taxa_pet_dia: 0, aceita_pets: false, ordem: 0, ativo: true, descricao_curta: null }],
    isLoading: false,
    isError: false,
  }),
  useConnectCanal: () => mutation,
  useSaveRoomMap: () => mutation,
  useSetReconcile2x: () => mutation,
  useReconcileNow: () => mutation,
}));

describe("MotorCanaisPage", () => {
  it("mostra status, timestamps, room map e fila de erros", () => {
    render(<MotorCanaisPage />);
    expect(screen.getByText("Canais (OTAs)")).toBeInTheDocument();
    // Rotulo legivel no Chip, nunca o codigo cru do backend.
    expect(screen.getByText("Divergente")).toBeInTheDocument();
    expect(screen.queryByText("DIVERGENTE")).not.toBeInTheDocument();
    // Divergencia em destaque (spec §5).
    expect(screen.getByText(/risco de overbooking/)).toBeInTheDocument();
    // Webhook nunca recebido -> travessao.
    expect(screen.getByText("Último webhook")).toBeInTheDocument();
    expect(screen.getByText("Reconciliar agora")).toBeInTheDocument();
    // Propriedade conectada e room map preenchido a partir do estado salvo.
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByLabelText("roomId Beds24 de Suíte Casal")).toHaveValue(777);
    // Fila de erros como tabela: acomodacao (nome legivel), periodo e tentativas.
    expect(screen.getByText("2026-09-01 → 2026-09-05")).toBeInTheDocument();
    expect(screen.getByText("Suíte Casal", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("5", { selector: "td" })).toBeInTheDocument();
    // O segredo do webhook NAO aparece em leitura normal — so na resposta do connect.
    expect(screen.queryByText(/segredo do webhook AGORA/)).not.toBeInTheDocument();
  });
});
