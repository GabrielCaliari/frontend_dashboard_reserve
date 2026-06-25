import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VariationBadge } from "../variation-badge";

describe("VariationBadge", () => {
  it("renders a positive variation in green with an up arrow, by default", () => {
    render(<VariationBadge value={12.5} />);
    const badge = screen.getByText("+12.5%");
    expect(badge).toHaveClass("text-emerald-600");
  });

  it("renders a negative variation in red with a down arrow, by default", () => {
    render(<VariationBadge value={-8} />);
    const badge = screen.getByText("-8%");
    expect(badge).toHaveClass("text-red-600");
  });

  it("inverts the color for cost metrics: a drop in cost is positive (green)", () => {
    render(<VariationBadge value={-8} invertColor />);
    const badge = screen.getByText("-8%");
    expect(badge).toHaveClass("text-emerald-600");
  });

  it("inverts the color for cost metrics: a rise in cost is negative (red)", () => {
    render(<VariationBadge value={8} invertColor />);
    const badge = screen.getByText("+8%");
    expect(badge).toHaveClass("text-red-600");
  });

  it("renders neutral gray at exactly zero", () => {
    render(<VariationBadge value={0} />);
    const badge = screen.getByText("0%");
    expect(badge).toHaveClass("text-muted-foreground");
  });
});
