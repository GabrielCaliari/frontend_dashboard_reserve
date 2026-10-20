import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoadMoreFooter } from "../load-more-footer";

describe("LoadMoreFooter", () => {
  it("mostra X de N e carrega mais quando faltam itens", async () => {
    const onLoadMore = vi.fn();
    render(<LoadMoreFooter shown={50} total={120} onLoadMore={onLoadMore} />);
    expect(screen.getByText("Mostrando 50 de 120")).toBeTruthy();
    await userEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("esconde o botão quando tudo foi carregado", () => {
    render(<LoadMoreFooter shown={3} total={3} onLoadMore={vi.fn()} />);
    expect(screen.getByText("Mostrando 3 de 3")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Carregar mais" })).toBeNull();
  });
});
