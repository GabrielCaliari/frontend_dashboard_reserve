import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Pencil, Trash2 } from "lucide-react";
import { EntityRowActions } from "./entity-row-actions";

describe("EntityRowActions", () => {
  it("opens the menu and calls onSelect for the chosen action", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <EntityRowActions
        ariaLabel="Ações de Ana Silva"
        actions={[
          { key: "edit", label: "Editar", icon: Pencil, onSelect: onEdit },
          {
            key: "delete",
            label: "Excluir",
            icon: Trash2,
            tone: "danger",
            onSelect: onDelete,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ações de Ana Silva" }));
    fireEvent.click(await screen.findByText("Excluir"));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("renders nothing when there are no actions", () => {
    const { container } = render(
      <EntityRowActions ariaLabel="Ações de Ana Silva" actions={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
