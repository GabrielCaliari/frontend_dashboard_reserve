import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PeriodBar, periodForMonth } from "../period-bar";

describe("PeriodBar", () => {
  it("mostra o rotulo do mes e navega com as setas", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "month", from: "2026-08-01", to: "2026-08-31" }} onChange={onChange} />);
    expect(screen.getByText(/agosto de 2026/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /proximo periodo/i }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ from: "2026-09-01", to: "2026-09-30" }));
  });

  it("troca para janela de 7 dias a partir do from atual", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "month", from: "2026-08-01", to: "2026-08-31" }} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "7 dias" }));
    expect(onChange).toHaveBeenCalledWith({ window: "d7", from: "2026-08-01", to: "2026-08-07" });
  });

  it("janela personalizada expoe inputs de data", () => {
    const onChange = vi.fn();
    render(<PeriodBar value={{ window: "custom", from: "2026-08-05", to: "2026-08-09" }} onChange={onChange} />);
    const inputs = screen.getAllByLabelText(/data (inicial|final)/i);
    expect(inputs).toHaveLength(2);
    fireEvent.change(inputs[1], { target: { value: "2026-08-12" } });
    expect(onChange).toHaveBeenCalledWith({ window: "custom", from: "2026-08-05", to: "2026-08-12" });
  });

  it("periodForMonth cobre o mes inteiro", () => {
    expect(periodForMonth(new Date(2026, 7, 15))).toEqual({ window: "month", from: "2026-08-01", to: "2026-08-31" });
  });
});
