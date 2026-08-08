import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalLineChart } from "../line-chart";

const data = [
  { day: "01/08", conversas: 4 },
  { day: "02/08", conversas: 7 },
];

describe("PortalLineChart", () => {
  it("shows the skeleton while loading", () => {
    render(
      <PortalLineChart
        data={[]}
        xKey="day"
        series={[{ key: "conversas", label: "Conversas", color: "#0ea5e9" }]}
        isLoading
      />,
    );
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });

  it("shows the empty state when there is no data and it is not loading", () => {
    render(
      <PortalLineChart
        data={[]}
        xKey="day"
        series={[{ key: "conversas", label: "Conversas", color: "#0ea5e9" }]}
      />,
    );
    expect(screen.getByText(/sem dados no período/i)).toBeInTheDocument();
  });

  it("renders the chart figure when data is present", () => {
    render(
      <PortalLineChart
        data={data}
        xKey="day"
        series={[{ key: "conversas", label: "Conversas", color: "#0ea5e9" }]}
      />,
    );
    expect(screen.getByRole("figure")).toBeInTheDocument();
  });
});
