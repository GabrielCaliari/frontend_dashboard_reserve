import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TypeAvailabilityHeatmap,
  availabilityTone,
} from "../type-availability-heatmap";
import type { MotorCalendarUnidade } from "@/src/shared/domain/types/@motor";

const unidades: MotorCalendarUnidade[] = [
  {
    unit_id: "u1",
    identificador: "Casal 1",
    room_type_id: "rt1",
    room_type_nome: "Suite Casal",
    dias: [{ data: "2026-08-01", estado: "LIVRE" }],
  },
  {
    unit_id: "u2",
    identificador: "Casal 2",
    room_type_id: "rt1",
    room_type_nome: "Suite Casal",
    dias: [{ data: "2026-08-01", estado: "CONFIRMADA" }],
  },
  {
    unit_id: "u3",
    identificador: "Teste 1",
    room_type_id: "rt2",
    room_type_nome: "Teste",
    dias: [{ data: "2026-08-01", estado: "BLOCK" }],
  },
] as MotorCalendarUnidade[];

describe("TypeAvailabilityHeatmap", () => {
  it("agrega unidades livres por tipo e dia", () => {
    render(<TypeAvailabilityHeatmap unidades={unidades} />);
    expect(screen.getByText("Suite Casal")).toBeInTheDocument();
    expect(screen.getByText("2 un.")).toBeInTheDocument();
    expect(screen.getByLabelText("Suite Casal 2026-08-01: 1 de 2 livres")).toBeInTheDocument();
    // bloqueio/mensalista nao conta como livre
    expect(screen.getByLabelText("Teste 2026-08-01: 0 de 1 livres")).toBeInTheDocument();
  });
});

describe("availabilityTone", () => {
  it("zero e vermelho, poucas e ambar, cheio e verde", () => {
    expect(availabilityTone(0, 3)).toContain("danger");
    expect(availabilityTone(1, 3)).toContain("warning");
    expect(availabilityTone(3, 3)).toContain("success");
  });
});
