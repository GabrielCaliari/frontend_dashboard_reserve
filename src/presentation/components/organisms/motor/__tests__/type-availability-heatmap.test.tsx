import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TypeAvailabilityHeatmap,
  availabilityTone,
} from "../type-availability-heatmap";
import type { MotorCalendarUnidade, MotorGrade } from "@/src/shared/domain/types/@motor";

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
] as MotorCalendarUnidade[];

const grade: MotorGrade = {
  from: "2026-08-01",
  to: "2026-08-02",
  room_types: [
    {
      room_type_id: "rt1",
      nome: "Suite Casal",
      capacidade_base: 2,
      capacidade_max: 3,
      valor_pessoa_adicional: 50,
      total_units: 2,
      dias: [
        { data: "2026-08-01", preco: 320, min_stay: 1, stop_sell: false, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 1 },
        { data: "2026-08-02", preco: 320, min_stay: 1, stop_sell: true, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 2 },
      ],
    },
  ],
};

describe("TypeAvailabilityHeatmap", () => {
  it("usa a mesma fonte da grade: mostra unidades a venda por tipo e dia", () => {
    render(<TypeAvailabilityHeatmap grade={grade} unidades={unidades} />);
    expect(screen.getByText("Suite Casal")).toBeInTheDocument();
    expect(screen.getByText("2 un.")).toBeInTheDocument();
    expect(screen.getByLabelText("Suite Casal 2026-08-01: 1 à venda de 2")).toBeInTheDocument();
  });

  it("dia com stop de vendas mostra 0 mesmo com unidades livres (sincronia com a grade)", () => {
    render(<TypeAvailabilityHeatmap grade={grade} unidades={unidades} />);
    const celula = screen.getByLabelText("Suite Casal 2026-08-02: 0 à venda de 2");
    expect(celula).toBeInTheDocument();
    expect(celula).toHaveTextContent("0");
  });
});

describe("availabilityTone", () => {
  it("zero e vermelho, poucas e ambar, cheio e verde", () => {
    expect(availabilityTone(0, 3)).toContain("danger");
    expect(availabilityTone(1, 3)).toContain("warning");
    expect(availabilityTone(3, 3)).toContain("success");
  });
});
