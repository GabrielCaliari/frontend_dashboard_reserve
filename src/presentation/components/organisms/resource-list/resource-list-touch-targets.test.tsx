import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResourceListPagination } from "./resource-list-pagination";

describe("resource-list touch targets", () => {
  it("gives pagination icon controls a minimum 44px square target, matching entity-list", () => {
    render(<ResourceListPagination page={2} totalItems={30} pageSize={10} onPageChange={vi.fn()} />);

    for (const name of ["Página anterior", "Próxima página"]) {
      expect(screen.getByRole("button", { name })).toHaveClass("min-h-11", "min-w-11");
    }
  });
});
