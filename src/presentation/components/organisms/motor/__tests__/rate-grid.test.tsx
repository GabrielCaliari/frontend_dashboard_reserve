import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RateGrid } from "../rate-grid";
import type { MotorGrade } from "@/src/shared/domain/types/@motor";

const grade: MotorGrade = {
  from: "2026-09-05", to: "2026-09-06",
  room_types: [{
    room_type_id: "rt1", nome: "Suite Casal", capacidade_base: 2, capacidade_max: 3,
    valor_pessoa_adicional: 50, total_units: 2,
    dias: [
      { data: "2026-09-05", preco: 320, min_stay: 2, stop_sell: false, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 1 },
      { data: "2026-09-06", preco: 320, min_stay: 1, stop_sell: true, closed_arrival: false, closed_departure: false, override: false, unidades_livres: 0 },
    ],
  }],
};

describe("RateGrid", () => {
  it("mostra tipo, livres por dia e precos por ocupacao", () => {
    render(<RateGrid grade={grade} canManage onCellClick={vi.fn()} />);
    expect(screen.getByText("Suite Casal")).toBeInTheDocument();
    expect(screen.getByText("2 pessoas")).toBeInTheDocument();
    expect(screen.getByText("3 pessoas")).toBeInTheDocument(); // base + 1
  });

  it("clique na celula de disponibilidade dispara onCellClick", () => {
    const onCellClick = vi.fn();
    render(<RateGrid grade={grade} canManage onCellClick={onCellClick} />);
    fireEvent.click(screen.getByRole("button", { name: /suite casal 2026-09-05/i }));
    expect(onCellClick).toHaveBeenCalledWith(grade.room_types[0], grade.room_types[0].dias[0]);
  });

  it("dia com stop de vendas fica marcado", () => {
    render(<RateGrid grade={grade} canManage onCellClick={vi.fn()} />);
    expect(screen.getByRole("button", { name: /suite casal 2026-09-06.*fechado/i })).toBeInTheDocument();
  });
});
