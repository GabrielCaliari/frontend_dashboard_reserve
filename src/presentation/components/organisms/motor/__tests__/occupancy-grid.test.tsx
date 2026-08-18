import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OccupancyGrid } from "../occupancy-grid";
import type { MotorCalendar } from "@/src/shared/domain/types/@motor";

const calendar: MotorCalendar = {
  mes: "2026-09",
  unidades: [
    {
      unit_id: "u_1",
      identificador: "Casal 01",
      room_type_id: "rt_1",
      room_type_nome: "Suíte Casal",
      dias: [
        { data: "2026-09-01", estado: "LIVRE" },
        { data: "2026-09-02", estado: "CONFIRMADA", reservation_id: "r_1", hospede_nome: "Maria" },
        { data: "2026-09-03", estado: "MENSALISTA", block_id: "b_1" },
      ],
    },
  ],
};

describe("OccupancyGrid", () => {
  it("renderiza uma linha por unidade e uma celula por dia com o estado", () => {
    render(<OccupancyGrid calendar={calendar} onCellClick={vi.fn()} />);
    expect(screen.getByText("Casal 01")).toBeInTheDocument();
    const cells = screen.getAllByRole("button", { name: /Casal 01/ });
    expect(cells).toHaveLength(3);
    expect(cells[1]).toHaveAccessibleName(expect.stringContaining("Confirmada"));
    expect(cells[2]).toHaveAccessibleName(expect.stringContaining("Mensalista"));
  });

  it("clique na celula devolve unidade e dia", () => {
    const onCellClick = vi.fn();
    render(<OccupancyGrid calendar={calendar} onCellClick={onCellClick} />);
    screen.getAllByRole("button", { name: /Casal 01/ })[0].click();
    expect(onCellClick).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: "u_1" }),
      expect.objectContaining({ data: "2026-09-01", estado: "LIVRE" }),
    );
  });
});
