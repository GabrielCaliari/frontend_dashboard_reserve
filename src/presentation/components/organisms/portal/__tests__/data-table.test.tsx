import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PortalDataTable, type PortalDataTableColumn } from "../data-table";

interface Row {
  id: string;
  campaign: string;
  spend: number;
}

const rows: Row[] = [
  { id: "1", campaign: "Verão 2026", spend: 850 },
  { id: "2", campaign: "Fim de ano", spend: 420 },
];

const columns: PortalDataTableColumn<Row>[] = [
  { key: "campaign", header: "Campanha", render: (row) => row.campaign },
  { key: "spend", header: "Investimento", render: (row) => `R$ ${row.spend}` },
];

describe("PortalDataTable", () => {
  it("renders an HTML table on desktop", () => {
    vi.doMock("@/src/shared/hooks/portal/use-media-query", () => ({ useMediaQuery: () => false }));
    render(<PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Verão 2026")).toBeInTheDocument();
  });

  it("renders stacked cards, not a table, on mobile viewports", () => {
    render(<PortalDataTable columns={columns} rows={rows} getRowKey={(r) => r.id} forceMobile />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Verão 2026")).toBeInTheDocument();
    expect(screen.getByText("R$ 850")).toBeInTheDocument();
  });
});
