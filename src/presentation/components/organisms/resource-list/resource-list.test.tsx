import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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
  OperationalList,
  OperationalListBody,
  OperationalListCell,
  OperationalListHeader,
  OperationalListRow,
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

  it("adapts operational grids to responsive list semantics", () => {
    render(
      <OperationalList aria-label="Usuários">
        <OperationalListHeader>
          <OperationalListCell>Nome</OperationalListCell>
          <OperationalListCell>Email</OperationalListCell>
        </OperationalListHeader>
        <OperationalListBody>
          <OperationalListRow>
            <OperationalListCell>Ada</OperationalListCell>
            <OperationalListCell>ada@example.com</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    expect(screen.getByRole("list", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Nome");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const labels = within(screen.getByRole("listitem")).getAllByText("Nome");
    const accessibleLabels = labels.filter(
      (label) => label.getAttribute("aria-hidden") !== "true",
    );
    expect(accessibleLabels).toHaveLength(1);
    expect(accessibleLabels[0]).toHaveClass("sr-only");
    expect(labels.find((label) => label.getAttribute("aria-hidden") === "true")).toHaveClass(
      "sm:hidden",
    );
  });

  it("keeps row actions keyboard accessible", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onAction={onAction} textValue="Abrir lead">
            <OperationalListCell>Lead</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    const primaryAction = screen.getByRole("button", { name: "Abrir lead" });
    expect(primaryAction.parentElement).toHaveAttribute("role", "presentation");
    primaryAction.focus();
    await user.keyboard("{Enter}");
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("preserves single-selection callbacks from operational tables", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <OperationalList aria-label="Leads" selectionMode="single" onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-42" textValue="Selecionar Ada">
            <OperationalListCell>Ada</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );

    await user.click(screen.getByRole("button", { name: "Selecionar Ada" }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["lead-42"]));
  });

  it("activates onClick-only rows with Enter and Space", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onClick={onClick} textValue="Abrir lead">
            <OperationalListCell>Lead</OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    const row = screen.getByRole("button", { name: "Abrir lead" });
    row.focus();
    await user.keyboard("{Enter}{Space}");
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("keeps descendant actions operable without activating the row", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    const onActionClick = vi.fn();
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody>
          <OperationalListRow onClick={onRowClick} textValue="Lead Ada">
            <OperationalListCell onClick={(event) => event.stopPropagation()} data-testid="actions">
              <button onClick={onActionClick}>Editar</button>
            </OperationalListCell>
          </OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(onActionClick).toHaveBeenCalledOnce();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("accumulates and removes controlled multiple selection", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys={new Set(["lead-1"])} onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    expect(screen.getByRole("button", { name: /Ada/ })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /Grace/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["lead-1", "lead-2"]));
    rerender(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys={new Set(["lead-1", "lead-2"])} onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: /Ada/ }));
    expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["lead-2"]));
  });

  it("renders ReactNode loading content intact", () => {
    render(
      <OperationalList aria-label="Leads">
        <OperationalListBody isLoading loadingLabel="Loading leads" loadingContent={<div data-testid="skeleton">Skeleton customizado</div>} />
      </OperationalList>,
    );
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading leads" })).toBeInTheDocument();
  });

  it("supports removeWrapper without legacy wrapper decoration", () => {
    render(
      <OperationalList aria-label="Autores" removeWrapper classNames={{ wrapper: "border bg-content1 shadow", table: "space-y-9" }}>
        <OperationalListBody>
          <OperationalListRow><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    const root = screen.getByRole("list", { name: "Autores" }).parentElement;
    expect(root).not.toHaveClass("space-y-3", "space-y-9", "border", "bg-content1", "shadow");
  });

  it("expands selectedKeys all before deselecting one visible item", async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    render(
      <OperationalList aria-label="Leads" selectionMode="multiple" selectedKeys="all" onSelectionChange={onSelectionChange}>
        <OperationalListBody>
          <OperationalListRow key="lead-1" textValue="Ada"><OperationalListCell>Ada</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-2" textValue="Grace"><OperationalListCell>Grace</OperationalListCell></OperationalListRow>
          <OperationalListRow key="lead-3" textValue="Linus"><OperationalListCell>Linus</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    await user.click(screen.getByRole("button", { name: "Grace" }));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["lead-1", "lead-3"]));
  });

  it("applies compatibility classes to rows and cells", () => {
    render(
      <OperationalList aria-label="Leads" classNames={{ tr: "legacy-row", td: "legacy-cell" }}>
        <OperationalListBody>
          <OperationalListRow><OperationalListCell data-testid="cell">Ada</OperationalListCell></OperationalListRow>
        </OperationalListBody>
      </OperationalList>,
    );
    expect(screen.getByRole("listitem").firstElementChild?.firstElementChild).toHaveClass("legacy-row");
    expect(screen.getByTestId("cell")).toHaveClass("legacy-cell");
  });
});
