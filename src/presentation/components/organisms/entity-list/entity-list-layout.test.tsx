import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EntityListLayout } from "./entity-list-layout";

describe("EntityListLayout", () => {
  it("keeps filters in a desktop sidebar and exposes them through a mobile sheet", () => {
    render(
      <EntityListLayout filters={<p>Filtros de leads</p>} toolbar={<p>Buscar leads</p>}>
        <p>Linhas de leads</p>
      </EntityListLayout>,
    );

    expect(screen.getByRole("complementary", { name: "Filtros" })).toHaveTextContent(
      "Filtros de leads",
    );
    expect(screen.getByText("Buscar leads")).toBeVisible();
    expect(screen.getByText("Linhas de leads")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Abrir filtros" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Filtros de leads");
  });
});
