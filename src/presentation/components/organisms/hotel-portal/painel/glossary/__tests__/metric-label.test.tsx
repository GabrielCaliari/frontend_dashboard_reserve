import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MetricLabel } from "../metric-label";

vi.mock("@/src/shared/hooks/use-media-query", () => ({
  useMediaQuery: () => false, // desktop by default in this test file
}));

describe("MetricLabel", () => {
  it('renders the glossary label and a "?" trigger', () => {
    render(<MetricLabel metricKey="investimento" />);
    expect(screen.getByText("Investimento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /o que é/i })).toBeInTheDocument();
  });

  it("shows the tooltip content on desktop when the trigger is clicked", async () => {
    render(<MetricLabel metricKey="custo_por_conversa" />);
    const trigger = screen.getByRole("button", { name: /o que é/i });
    // Radix's Tooltip opens on focus (as a real browser click also focuses the
    // button), not on the click event itself -- jsdom's fireEvent.click does not
    // synthesize a focus event the way a real click does, so it's fired explicitly.
    fireEvent.click(trigger);
    fireEvent.focus(trigger);
    // Radix renders the tooltip's text twice (the visible content plus a
    // visually-hidden accessibility duplicate for screen readers), so a plain
    // findByText throws "found multiple elements" -- assert on the group instead.
    const matches = await screen.findAllByText(/quanto custou, em média/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
