import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntityListItem } from "./entity-list-item";

describe("EntityListItem", () => {
  it("supports accessible selection and keyboard row activation", () => {
    const onActivate = vi.fn();
    const onSelectionChange = vi.fn();

    render(
      <ul>
        <EntityListItem
          title="Ana Silva"
          description="ana@example.com"
          status={{ label: "Ativo", tone: "success" }}
          selectable={{
            label: "Selecionar Ana Silva",
            selected: false,
            onSelectionChange,
          }}
          onActivate={onActivate}
        />
      </ul>,
    );

    fireEvent.click(screen.getByRole("checkbox", { name: "Selecionar Ana Silva" }));
    fireEvent.keyDown(screen.getByRole("button", { name: "Ana Silva" }), {
      key: "Enter",
    });

    expect(onSelectionChange).toHaveBeenCalledWith(true);
    expect(onActivate).toHaveBeenCalledOnce();
    expect(screen.getByText("Ativo")).toBeVisible();
  });

  it("does not activate the row when an action is clicked", () => {
    const onActivate = vi.fn();
    const onEdit = vi.fn();

    render(
      <ul>
        <EntityListItem
          title="Ana Silva"
          actions={<button onClick={onEdit}>Editar Ana</button>}
          onActivate={onActivate}
        />
      </ul>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editar Ana" }));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onActivate).not.toHaveBeenCalled();
  });
});
