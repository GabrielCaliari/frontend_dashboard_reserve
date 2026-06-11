import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  ResourceList,
  ResourceListEmptyState,
  ResourceListErrorState,
  ResourceListLoadingState,
  ResourceListPagination,
  ResourceListRow,
  ResourceListToolbar,
} from "./index";

describe("resource list components", () => {
  it("renders controlled search and filters and reports changes", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    function ControlledToolbar() {
      const [search, setSearch] = useState("");
      return (
        <ResourceListToolbar
          count={<span>3 campanhas</span>}
          searchLabel="Buscar campanhas"
          searchValue={search}
          onSearchChange={setSearch}
          filters={[
            {
              key: "status",
              label: "Status",
              value: "all",
              options: [
                { value: "all", label: "Todos" },
                { value: "draft", label: "Rascunho" },
              ],
              onChange: onFilterChange,
            },
          ]}
        />
      );
    }
    render(<ControlledToolbar />);
    const search = screen.getByRole("textbox", { name: "Buscar campanhas" });
    await user.type(search, "abc");
    expect(search).toHaveValue("abc");
    expect(screen.getByRole("status", { name: "Total de recursos" })).toHaveTextContent(
      "3 campanhas",
    );
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "draft");
    expect(onFilterChange).toHaveBeenCalledWith("draft");
  });

  it("uses accessible list and listitem semantics with a labeled status rail and keyboard action", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <ResourceList aria-label="Campanhas">
        <ResourceListRow
          statusLabel="Ativa"
          statusColor="success"
          actions={<button onClick={onOpen}>Abrir</button>}
        >
          Campanha Julho
        </ResourceListRow>
      </ResourceList>,
    );
    expect(screen.getByRole("list", { name: "Campanhas" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Campanha Julho");
    expect(screen.getByLabelText("Status: Ativa")).toBeInTheDocument();
    expect(screen.getByText("Ativa")).toBeVisible();
    screen.getByRole("button", { name: "Abrir" }).focus();
    await user.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("treats an empty children array as an empty list", () => {
    render(<ResourceList aria-label="Campanhas">{[]}</ResourceList>);
    expect(screen.getByRole("status")).toHaveTextContent("Nenhum recurso encontrado");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it.each([
    {
      props: { isLoading: true, loadingLabel: "Carregando campanhas" },
      role: "status",
      text: "Carregando campanhas",
    },
    { props: { error: "Falha ao carregar" }, role: "alert", text: "Falha ao carregar" },
    { props: {}, role: "status", text: "Nenhum recurso encontrado" },
  ])("renders list state $text", ({ props, role, text }) => {
    render(<ResourceList aria-label="Campanhas" {...props} />);
    expect(screen.getByRole(role)).toHaveTextContent(text);
  });

  it("exports reusable loading, error, and empty states", () => {
    render(
      <>
        <ResourceListLoadingState label="Carregando itens" />
        <ResourceListErrorState>Erro de rede</ResourceListErrorState>
        <ResourceListEmptyState>Nada por aqui</ResourceListEmptyState>
      </>,
    );
    expect(screen.getByRole("status", { name: "Carregando itens" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Erro de rede");
    expect(screen.getByText("Nada por aqui")).toBeInTheDocument();
  });

  it("disables pagination at boundaries and emits valid page changes", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const { rerender } = render(
      <ResourceListPagination page={1} totalItems={21} pageSize={10} onPageChange={onPageChange} />,
    );
    expect(screen.getByRole("button", { name: "Página anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Próxima página" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
    rerender(
      <ResourceListPagination page={3} totalItems={21} pageSize={10} onPageChange={onPageChange} />,
    );
    expect(screen.getByRole("button", { name: "Próxima página" })).toBeDisabled();
    rerender(
      <ResourceListPagination page={3} totalItems={5} pageSize={10} onPageChange={onPageChange} />,
    );
    await waitFor(() => expect(onPageChange).toHaveBeenCalledWith(1));
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("normalizes invalid page size before calculating ranges", () => {
    render(<ResourceListPagination page={2} totalItems={3} pageSize={0} onPageChange={vi.fn()} />);
    expect(screen.getByText("2–2 de 3")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});
