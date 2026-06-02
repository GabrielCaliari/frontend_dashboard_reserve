import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListPagination } from "./entity-list-pagination";

describe("EntityListPagination", () => {
  it("reports the visible range and advances to the next page", () => {
    const onPageChange = vi.fn();

    render(
      <EntityListPagination
        page={2}
        pageSize={25}
        totalItems={81}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText("26–50 de 81")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
